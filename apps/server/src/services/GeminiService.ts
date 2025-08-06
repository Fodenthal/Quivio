import { GoogleGenAI } from "@google/genai";
import { WordTokenizer } from 'natural';
import { removeStopwords, eng } from 'stopword';

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
  private ai: GoogleGenAI;

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
Validate rules 1–7 and schema compliance; fix and revalidate until all pass. Then return the JSON object.

**IMPORTANT: Output ONLY the raw JSON object. Do not include any explanatory text, markdown formatting, or prose before or after the JSON.**`;


  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Gemini API key is required");
    }
    
    this.ai = new GoogleGenAI({apiKey: apiKey});
  }

  /**
   * Stage 1: Gather factual context using Google Search
   * @param topic - The topic to research
   * @returns Promise<string> - Concise factual summary (1-2 sentences)
   */
  private async gatherFacts(topic: string): Promise<string> {
    console.log(`🔍 Stage 1: Gathering facts for topic: "${topic}"`);
    
    const factGatheringPrompt = `
You are Quivio's master trivia researcher. Your job is to gather accurate, specific facts about "${topic}" that would be suitable for creating trivia questions.

Use the Google Search tool if needed to find current, accurate information. Return a concise factual summary in 1-2 sentences that covers the most important, verifiable facts about this topic.

Focus on facts that would make good trivia questions - dates, numbers, names, locations, achievements, or other specific details that can be tested.

Topic to research: "${topic}"

Return only the factual summary - no extra formatting or explanations.`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: factGatheringPrompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0,
          topP: 1.0,
          topK: 1.0,
          maxOutputTokens: 256,
          thinkingConfig: {
            thinkingBudget: 128
          }
        }
      });

      const candidate = response.candidates?.[0];
      if (!candidate?.content?.parts?.[0]?.text) {
        console.warn("Raw Stage 1 response:", JSON.stringify(response, null, 2));
        return ''; // Empty facts - Stage 2 will proceed without context
      }

      const facts = candidate.content.parts[0].text.trim();
      console.log(`   ✅ Gathered facts (${facts.length} chars): "${facts}..."`);
      return facts;
    } catch (error) {
      console.warn(`⚠️  Stage 1 error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log(`   🔄 Proceeding to Stage 2 without additional context`);
      return ''; // Empty facts - Stage 2 will proceed without context
    }
  }

  /**
   * Stage 2: Format facts into structured JSON question
   * @param topic - The original topic
   * @param facts - Facts gathered from Stage 1 (may be empty)
   * @param request - The original question request
   * @returns Promise<GeneratedQuestion> - The formatted question
   */
  private async formatQuestion(topic: string, facts: string, request: QuestionRequest): Promise<GeneratedQuestion> {
    console.log(`🎯 Stage 2: Formatting question for topic: "${topic}"`);
    console.log(`   📄 Using facts: ${facts ? `"${facts.substring(0, 100)}..."` : 'None (basic prompt)'}`);
    
    const difficultyDescription = this.getDifficultyDescription(request.difficulty);
    
    const sections = [
      // Core instructions
      GeminiService.CORE_INSTRUCTIONS,
      
      // Task specification
      `Your task is to generate a single, specific, factual trivia question about "${topic}" with ${difficultyDescription} difficulty (${request.difficulty}/5).`
    ];

    // Add facts if available
    if (facts && facts.trim()) {
      sections.push(`**Context facts**: ${facts}`);
      sections.push(`Use these facts if you believe they help make the best questions ever. If you don't think they are relevant, ignore them.`);
    }

    // Add schema and previous questions
    sections.push(`Now, generate a JSON object for the topic "${topic}" that conforms to this JSON schema:\n${GeminiService.QUESTION_SCHEMA}`);

    if (request.previousQuestions && request.previousQuestions.length > 0) {
      console.log(`   📝 Avoiding ${request.previousQuestions.length} previous questions`);
      sections.push(
        `**Avoid repeating**: (a) the same fact/answer concepts, and (b) highly similar wording or templates as in these prior questions:\n${request.previousQuestions.join(", ")}`
      );
    }

    const prompt = sections.join('\n\n');
    console.log(`   📏 Stage 2 prompt length: ${prompt.length} characters`);

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          // No tools - pure formatting
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 1024,
          thinkingConfig: {
            thinkingBudget: 64
          }
        }
      });
      
      const candidate = response.candidates?.[0];
      if (!candidate?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response structure from Stage 2');
      }
      
      const text = candidate.content.parts[0].text;
      console.log(`   📄 Stage 2 response length: ${text.length} characters`);
      
      return this.parseResponse(text, request);
    } catch (error) {
      console.error(`❌ Stage 2 error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new Error(`Failed to format question: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a trivia question using two-stage approach
   * @param request - The question generation request
   * @returns Promise<GeneratedQuestion> - The generated question with acceptable answers
   */
  async generateQuestion(request: QuestionRequest): Promise<GeneratedQuestion> {
    const startTime = Date.now();
    console.log(`🚀 Starting two-stage question generation for topic: "${request.topic}"`);
    console.log(`   📊 Difficulty: ${request.difficulty}/5 (${this.getDifficultyDescription(request.difficulty)})`);
    
    try {
      // Stage 1: Gather facts (may return empty string if fails)
      const facts = await this.gatherFacts(request.topic);
      
      // Stage 2: Format question (deterministic)
      const generatedQuestion = await this.formatQuestion(request.topic, facts, request);
      
      // Log success
      const totalTime = Date.now() - startTime;
      console.log(`✅ Two-stage generation completed in ${totalTime}ms`);
      console.log(`   ❓ Question: "${generatedQuestion.question}"`);
      console.log(`   ✅ Correct answer: "${generatedQuestion.correctAnswer}"`);
      console.log(`   📋 Acceptable answers (${generatedQuestion.acceptableAnswers.length}): [${generatedQuestion.acceptableAnswers.join(', ')}]`);
      console.log(`   🏷️  Category: ${generatedQuestion.category}`);
      console.log(`   📊 Difficulty: ${generatedQuestion.difficulty}/5`);
      
      // Log question quality metrics
      const questionTokens = GeminiService.tokenizer.tokenize(generatedQuestion.question) || [];
      console.log(`   📏 Question length: ${questionTokens.length} tokens (target: ≤65)`);
      console.log(`   🎯 Question quality: ${questionTokens.length <= 65 ? '✅ Within token limit' : '⚠️ Exceeds token limit'}`);
      
      return generatedQuestion;
    } catch (error) {
      console.error("❌ Error in two-stage question generation:", error);
      console.error(`   🔍 Error details: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error(`   📊 Request context: topic="${request.topic}", difficulty=${request.difficulty}`);
      throw new Error(`Failed to generate question: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }



  /**
   * Parse the Gemini API response into a structured question object
   */
  private parseResponse(response: string, request: QuestionRequest): GeneratedQuestion {
    console.log(`🔍 Starting response parsing...`);
    console.log(`   📄 Raw response length: ${response.length} characters`);
    
    try {
      // Clean up markdown wrapper if present (new SDK often wraps JSON in code blocks)
      let cleanResponse = response.trim();
      console.log(`   🧹 Cleaning response format...`);
      
      if (cleanResponse.startsWith('```json') && cleanResponse.endsWith('```')) {
        cleanResponse = cleanResponse.slice(7, -3).trim(); // Remove ```json and ending ```
        console.log(`   ✅ Removed JSON code block wrapper`);
      } else if (cleanResponse.startsWith('```') && cleanResponse.endsWith('```')) {
        cleanResponse = cleanResponse.slice(3, -3).trim(); // Remove generic ``` wrappers
        console.log(`   ✅ Removed generic code block wrapper`);
      } else {
        console.log(`   ℹ️  No code block wrapper detected`);
      }
      
      console.log(`   📝 Cleaned response preview: "${cleanResponse.substring(0, 100)}..."`);
      
      // Parse JSON
      console.log(`   🔍 Attempting JSON parsing...`);
      const parsed = JSON.parse(cleanResponse);
      console.log(`   ✅ JSON parsed successfully`);
      
      // Validate required fields
      console.log(`   🔍 Validating required fields...`);
      const requiredFields = ['question', 'correctAnswer', 'acceptableAnswers'];
      const missingFields = requiredFields.filter(field => !parsed[field]);
      
      if (missingFields.length > 0) {
        console.error(`   ❌ Missing required fields: ${missingFields.join(', ')}`);
        throw new Error(`Missing required fields in API response: ${missingFields.join(', ')}`);
      }
      console.log(`   ✅ All required fields present`);

      // Ensure acceptableAnswers is an array and includes the correct answer
      console.log(`   🔍 Processing acceptable answers...`);
      let acceptableAnswers = Array.isArray(parsed.acceptableAnswers) ? parsed.acceptableAnswers : [parsed.correctAnswer];
      console.log(`   📋 Initial acceptable answers: [${acceptableAnswers.join(', ')}]`);
      
      // Add the correct answer to acceptable answers if not already included
      const correctAnswerLower = parsed.correctAnswer.toLowerCase();
      const hasCorrectAnswer = acceptableAnswers.some((ans: string) => ans.toLowerCase() === correctAnswerLower);
      
      if (!hasCorrectAnswer) {
        console.log(`   ➕ Adding correct answer to acceptable answers list`);
        acceptableAnswers.unshift(parsed.correctAnswer);
      } else {
        console.log(`   ✅ Correct answer already in acceptable answers`);
      }

      // Normalize all acceptable answers for consistent matching
      console.log(`   🔧 Normalizing acceptable answers...`);
      acceptableAnswers = acceptableAnswers.map((ans: string) => ans.trim());
      console.log(`   📋 Final acceptable answers (${acceptableAnswers.length}): [${acceptableAnswers.join(', ')}]`);

      const result = {
        question: parsed.question.trim(),
        correctAnswer: parsed.correctAnswer.trim(),
        acceptableAnswers,
        category: parsed.category || "General",
        difficulty: request.difficulty
      };
      
      console.log(`   ✅ Successfully parsed and validated question structure`);
      console.log(`   📊 Final question stats: category="${result.category}", difficulty=${result.difficulty}`);
      
      return result;
    } catch (error) {
      console.error("❌ Failed to parse Gemini response");
      console.error(`   📄 Response that failed to parse: "${response}"`);
      console.error(`   🔍 Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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