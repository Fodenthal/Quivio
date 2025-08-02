import { GoogleGenerativeAI } from "@google/generative-ai";
import { WordTokenizer } from 'natural';
import { removeStopwords, eng } from 'stopword';
import axios from 'axios';
import { CohereService } from './CohereService';

export interface GeneratedQuestion {
  question: string;
  correctAnswer: string;
  acceptableAnswers: string[];
  category: string;
  difficulty: number;
}

export interface QuestionRequest {
  topic: string;
  difficulty: number; // 1-5 scale
  previousQuestions?: string[]; // To avoid duplicates
}

/**
 * Service for generating trivia questions using Google Gemini API
 * Handles question generation with multiple acceptable answer variants
 */
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private cohereService: CohereService;

  // JSON Schema for the expected response format
  private static readonly QUESTION_SCHEMA = `{
    "type": "object",
    "properties": {
      "question": { "type": "string", "description": "The trivia question text." },
      "correctAnswer": { "type": "string", "description": "The primary factual answer." },
      "acceptableAnswers": {
        "type": "array",
        "items": { "type": "string" },
        "description": "All acceptable answer variants."
      },
      "category": {
        "type": "string",
        "description": "Broad category (Sports, History, Science, Film, etc.)."
      }
    },
    "required": ["question", "correctAnswer", "acceptableAnswers", "category"]
  }`;
  

  // Example question to demonstrate expected format and quality
  private static readonly EXAMPLE_QUESTION = `{
    "question": "What is the name of Harry Potter's pet owl?",
    "correctAnswer": "Hedwig",
    "acceptableAnswers": ["Hedwig", "hedwig"],
    "category": "Literature"
  }`;

  // Core instructions for question generation
  private static readonly CORE_INSTRUCTIONS = `

  You are Quivio’s master trivia author, known for crafting concise, engaging and fun questions. Output ONE JSON object only (no prose).

### Always-True Rules
1. **Direct trivia:** Test knowledge *about* the topic, never meta (no “What is often asked about…?”).
2. **Clarity & length:** Question must be ≤65 tokens, factually checkable, and yield an unambiguous answer.
3. **Difficulty knob:** 1=very easy, 5=expert. Calibrate thoughtfully (see request block).
4. **Non-trivial-number rule:** If the correct answer is a bare integer, it must satisfy ≥1: (a) ≥3 digits; (b) calendar year ≥1000; (c) decimal/fraction; (d) outside 1–20. If not, rewrite the question.
5. **Acceptable answers:** Include exhaustive common variants—abbreviations, nicknames, alternative spellings, formal names, punctuation variants (e.g., "GSW", "Golden State Warriors", "Wardell Curry Sr.").
6. **Diverse phrasing:** Across calls, vary structure (who/what/where/when/how many/records/dates/puzzle). Avoid repeating the same template every time (see prior questions below).
7. **Category:** Use the broadest sensible label (e.g., Sports for athlete facts unless clearly Film, History, etc.).

### Self-Check Before Returning
Validate rules 1–7 and schema compliance; fix and revalidate until all pass. Then return the JSON object.`;


  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Gemini API key is required");
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      tools: [
        { googleSearch: {} } as any
      ],
      generationConfig: {
        temperature: 0.4,
        topP:        0.9,
        maxOutputTokens: 512
      }
    });
    
    // Initialize CohereService for Wiki context retrieval
    this.cohereService = new CohereService();
  }

  /**
   * Generate a trivia question based on topic and difficulty
   * @param request - The question generation request
   * @returns Promise<GeneratedQuestion> - The generated question with acceptable answers
   */
  async generateQuestion(request: QuestionRequest): Promise<GeneratedQuestion> {
    // NEW: Get Wikipedia context via CohereService
    let contextualPrompt = this.buildPrompt(request);
    let cohereContextUsed = false;
    let cohereErrorDetails = null;
    
    try {
      console.log(`🔍 Requesting Cohere Wiki context for topic: "${request.topic}" (category: ${this.inferCategory(request.topic)})`);
      
      // Get Wiki context from CohereService
      const context = await this.cohereService.getWikiContext(request.topic);
      
      if (context && context.trim()) {
        const contextLength = context.length;
        
        // Enhanced logging with actual context content
        console.log(`📚 Enhanced question generation for "${request.topic}":`);
        console.log(`   📏 Context length: ${contextLength} characters`);
        console.log(`   📖 Source: Cohere Wiki-Weaviate`);
        console.log(`   📄 Context preview: "${context.substring(0, 200)}${contextLength > 200 ? '...' : ''}"`);
        
        // Check if this is the placeholder context (indicates Weaviate not fully integrated yet)
        if (context.includes('placeholder context until Weaviate integration')) {
          console.log(`   ⚠️  WARNING: Using placeholder context - Weaviate integration pending in Phase 2`);
        }
        
        contextualPrompt = this.buildContextualPrompt(request, context);
        cohereContextUsed = true;
      } else {
        console.log(`⚠️  CohereService returned empty context for "${request.topic}"`);
      }
    } catch (error) {
      // Enhanced error logging with specific details
      cohereErrorDetails = error instanceof Error ? error.message : 'Unknown error';
      
      if (error instanceof Error) {
        console.warn(`⚠️  CohereService error for "${request.topic}": ${error.message}`);
      } else {
        console.warn(`⚠️  CohereService unknown error for "${request.topic}": ${cohereErrorDetails}`);
      }
      
      console.log(`   🔄 Falling back to basic prompt generation`);
    }
    
    try {
      // EXISTING: Generate with Gemini (enhanced with context when available)
      const promptType = cohereContextUsed ? 'enhanced' : 'basic';
      console.log(`🤖 Generating question with ${promptType} prompt for "${request.topic}"`);
      
      const result = await this.model.generateContent(contextualPrompt);
      const response = await result.response;
      const text = response.text();
      
      const generatedQuestion = this.parseResponse(text, request);
      
      // Log generation success with context usage info
      console.log(`✅ Generated question: "${generatedQuestion.question}"`);
      console.log(`   📝 Answer: "${generatedQuestion.correctAnswer}"`);
      console.log(`   🏷️  Category: ${generatedQuestion.category}`);
      console.log(`   📊 Context used: ${cohereContextUsed ? 'Yes (Cohere Wiki)' : 'No (basic prompt)'}`);
      
      return generatedQuestion;
    } catch (error) {
      console.error("Error generating question with Gemini:", error);
      throw new Error(`Failed to generate question: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build the prompt for Gemini API based on the request parameters
   */
  private buildPrompt(request: QuestionRequest): string {
    const difficultyDescription = this.getDifficultyDescription(request.difficulty);
    
    const sections = [
      // Role and core instructions
      GeminiService.CORE_INSTRUCTIONS,
      
      // Task specification
      `Your task is to generate a single, specific, factual trivia question about "${request.topic}" with ${difficultyDescription} difficulty (${request.difficulty}/5).`,
      
      // Example for reference
      `**Example of question style and quality for topic "Harry Potter" with difficulty 3:**
      ${GeminiService.EXAMPLE_QUESTION}`,
      
      // Generation request with schema
      `Now, generate a JSON object for the topic "${request.topic}" that conforms to this JSON schema:
      ${GeminiService.QUESTION_SCHEMA}`
    ];

    // Add previous questions constraint if provided
    if (request.previousQuestions && request.previousQuestions.length > 0) {
      sections.push(
        `**Avoid repeating**: (a) the same fact/answer concepts, and (b) highly similar wording or templates (e.g., multiple "In what year..." or "How many..." starts) as in these prior questions**:
        ${request.previousQuestions.join(", ")}`
      );
    }

    return sections.join('\n\n');
  }

  /**
   * Build a prompt that includes Wikipedia context for enhanced question generation
   */
  private buildContextualPrompt(request: QuestionRequest, context: string): string {
    const difficultyDescription = this.getDifficultyDescription(request.difficulty);
    
    const sections = [
      // Role and core instructions
      GeminiService.CORE_INSTRUCTIONS,
      
      // Task specification with context
      `Your task is to generate a single, specific, factual trivia question about "${request.topic}" with ${difficultyDescription} difficulty (${request.difficulty}/5).`,
      
      // Wikipedia context for factual accuracy
      `**Wikipedia Context for "${request.topic}":**
      ${context}
      
      **Context Usage Instructions:**
      Use the above Wikipedia context to ensure factual accuracy and discover interesting details for your question. Base your question on specific facts, dates, numbers, or details mentioned in the context when possible.`,
      
      // Example for reference
      `**Example of question style and quality for topic "Harry Potter" with difficulty 3:**
      ${GeminiService.EXAMPLE_QUESTION}`,
      
      // Generation request with schema
      `Now, generate a JSON object for the topic "${request.topic}" that conforms to this JSON schema:
      ${GeminiService.QUESTION_SCHEMA}`
    ];

    // Add previous questions constraint if provided
    if (request.previousQuestions && request.previousQuestions.length > 0) {
      sections.push(
        `**Avoid repeating**: (a) the same fact/answer concepts, and (b) highly similar wording or templates (e.g., multiple "In what year..." or "How many..." starts) as in these prior questions:
        ${request.previousQuestions.join(", ")}`
      );
    }

    return sections.join('\n\n');
  }

  /**
   * Parse the Gemini API response into a structured question object
   */
  private parseResponse(response: string, request: QuestionRequest): GeneratedQuestion {
    try {
      const parsed = JSON.parse(response);
      
      // Validate required fields
      if (!parsed.question || !parsed.correctAnswer || !parsed.acceptableAnswers) {
        throw new Error("Missing required fields in API response");
      }

      // Ensure acceptableAnswers is an array and includes the correct answer
      let acceptableAnswers = Array.isArray(parsed.acceptableAnswers) ? parsed.acceptableAnswers : [parsed.correctAnswer];
      
      // Add the correct answer to acceptable answers if not already included
      if (!acceptableAnswers.some((ans: string) => ans.toLowerCase() === parsed.correctAnswer.toLowerCase())) {
        acceptableAnswers.unshift(parsed.correctAnswer);
      }

      // Normalize all acceptable answers for consistent matching
      acceptableAnswers = acceptableAnswers.map((ans: string) => ans.trim());

      return {
        question: parsed.question.trim(),
        correctAnswer: parsed.correctAnswer.trim(),
        acceptableAnswers,
        category: parsed.category || "General",
        difficulty: request.difficulty
      };
    } catch (error) {
      console.error("Failed to parse Gemini response:", response);
      throw new Error(`Failed to parse question response: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
    }
  }

  /**
   * Get human-readable difficulty description
   */
  private getDifficultyDescription(difficulty: number): string {
    if (difficulty <= 1) return "very easy";
    if (difficulty <= 2) return "easy";
    if (difficulty <= 3) return "medium";
    if (difficulty <= 4) return "hard";
    return "very hard";
  }

  /**
   * Infer the category for rag-service based on topic keywords
   * Must return one of: 'News', 'History', 'Media', 'Sports', 'General'
   */
  private inferCategory(topic: string): string {
    const topicLower = topic.toLowerCase();
    
    // Define category keywords matching rag-service expectations
    const categoryKeywords: Record<string, string[]> = {
      'History': ['history', 'president', 'king', 'queen', 'war', 'empire', 'ancient', 'medieval', 'historical'],
      'Sports': ['sports', 'athlete', 'team', 'game', 'championship', 'olympic', 'football', 'basketball', 'soccer', 'tennis'],
      'Media': ['film', 'movie', 'actor', 'actress', 'director', 'television', 'tv', 'show', 'series', 'entertainment'],
      'News': ['news', 'current', 'politics', 'government', 'election', 'policy', 'political']
    };
    
    // Find matching category
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => topicLower.includes(keyword))) {
        return category;
      }
    }
    
    return 'General'; // Default fallback for science, technology, people, etc.
  }

  // Word tokenizer instance for consistent tokenization
  private static readonly tokenizer = new WordTokenizer();

  /**
   * Normalize text while preserving important punctuation in abbreviations
   * @param text - The text to normalize
   * @returns string - The normalized text
   */
  private static normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      // Preserve periods in abbreviations like "U.S.A." or "Ph.D."
      .replace(/\b([A-Z]\.){2,}/g, (match) => match.replace(/\./g, ''))
      // Remove other punctuation
      .replace(/[^\w\s]/g, ' ')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Break an answer into significant tokens, removing stop words
   * @param answer - The answer to tokenize
   * @returns string[] - Array of significant tokens
   */
  private static tokenize(answer: string): string[] {
    const normalizedText = this.normalizeText(answer);
    const tokens = this.tokenizer.tokenize(normalizedText) || [];
    // Remove stop words using the stopword library
    return removeStopwords(tokens, eng).filter(token => token.length > 0);
  }

  /**
   * Check if an answer matches any of the acceptable answers using enhanced token-based matching
   * @param userAnswer - The user's submitted answer
   * @param acceptableAnswers - Array of acceptable answer variations
   * @returns boolean - Whether the answer is acceptable
   */
  static isAnswerAcceptable(userAnswer: string, acceptableAnswers: string[]): boolean {
    if (!userAnswer?.trim() || !acceptableAnswers?.length) {
      return false;
    }

    const userTokens = new Set(this.tokenize(userAnswer));

    // Early return for empty user tokens after stop-word removal
    if (userTokens.size === 0) {
      return false;
    }

    return acceptableAnswers.some(acceptableAnswer => {
      const acceptableTokens = this.tokenize(acceptableAnswer);
      
      // Empty acceptable answer tokens should not match
      if (acceptableTokens.length === 0) {
        return false;
      }
      
      // Every token from the accepted answer must appear in the user's tokens
      return acceptableTokens.every(token => userTokens.has(token));
    });
  }

  /**
   * @deprecated Use isAnswerAcceptable instead - kept for backward compatibility
   */
  static normalizeAnswer(answer: string): string {
    return this.normalizeText(answer);
  }
} 