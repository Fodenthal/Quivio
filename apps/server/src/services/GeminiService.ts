import { GoogleGenAI } from "@google/genai";
import { WordTokenizer } from 'natural';
import { removeStopwords, eng } from 'stopword';
import { shouldSkipSearch } from './SearchDecision';

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

  You are Quivio’s master trivia author. Output ONE JSON object only (no prose).

  ### Always-True Rules
  1. Direct trivia only: Ask about a single, concrete, checkable fact. Absolutely no meta: no definitions, origins, overviews, "about the field", or "how the game works".
  2. Clarity & length: ≤65 tokens, unambiguous single answer, fact-checkable.
  3. Difficulty knob: 1 = very easy, 5 = expert. Calibrate to the request.
  4. Non-trivial-number rule: If the answer is a bare number, ensure one of: (a) ≥3 digits; (b) year ≥ 1000; (c) decimal/fraction; or (d) outside 1–20. Otherwise, rewrite.
  5. Acceptable answers: Include common variants—abbreviations, nicknames, alternative spellings, number/word forms, punctuation variants.
  6. Diverse phrasing over time; avoid repeating templates seen in prior questions.
  7. Category: Use a sensible broad label (e.g., Sports, History, Science).

  ### Topic Handling
  • If the topic is a broad domain (e.g., "geography", "mathematics", "probability"), instantiate a specific, self-contained question in that domain (no definitions/overviews). Examples:
    – Probability (≈3/5): "A fair die is rolled 3 times. What is the expected value of the sum?" → 10.5
    – Geography (≈2/5): "What is the capital of Canada?" → Ottawa
    – Geometry (≈3/5): "What is the area of a circle with radius 5?" → 25π
  • If the topic refers to a specific entity or a time-sensitive/superlative, ask a direct factual question about that entity (e.g., date, number, record, winner).

  ### Self-Check Before Returning
  Enforce the rules and ensure the question is not meta. Return ONLY the JSON object.`;


  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Gemini API key is required");
    }
    
    this.ai = new GoogleGenAI({apiKey: apiKey});
  }

  /**
   * Stage 1: Search-only factual context gathering (summary output)
   * Decision to search is handled outside via heuristics; when invoked, search tools are enabled
   * and the model must perform web search and synthesize a concise summary.
   * @param topic - The topic to research (search is required for this call)
   * @param enableSearchTools - If true, allow model to use Google Search tool; otherwise, skip tools
   * @returns Promise<string> - Concise factual summary (1–2 sentences)
   */
  private async gatherFacts(topic: string, enableSearchTools: boolean): Promise<string> {
    console.log(`🔍 Stage 1: Gathering facts for topic: "${topic}"`);
    
    const CHAR_LIMIT = 400;
    const factGatheringPrompt = `
You are a master researcher for a trivia game. SEARCH IS REQUIRED for: "${topic}".

OBJECTIVE
- Use the Google Search tool to find concrete, testable facts.
- Prefer fresh, non-obvious angles over generic summaries.

OUTPUT CONSTRAINTS (hard):
- EXACTLY 1–2 sentences, plain text only, TOTAL ≤ ${CHAR_LIMIT} characters.
- No lists/bullets/markdown/quotes/citations. No parentheticals unless part of a proper name.

PROCEDURE
1) Issue one or more search queries targeting different angles if needed.
2) Skim results and extract 1–2 specific facts suitable for trivia.
3) Synthesize into 1–2 sentences within the character cap.

Return ONLY the 1–2 sentence summary.`;

    try {
      const request: any = {
        model: 'gemini-2.5-flash',
        contents: factGatheringPrompt,
        config: {
          temperature: 0,
          topP: 1.0,
          topK: 1.0,
          maxOutputTokens: 512,
          thinkingConfig: {
            thinkingBudget: 128
          }
        }
      };
      if (enableSearchTools) {
        request.config.tools = [{ googleSearch: {} }];
      }
      const response = await this.ai.models.generateContent(request);

      const candidate = response.candidates?.[0];
      if (!candidate?.content?.parts?.[0]?.text) {
        console.warn("Raw Stage 1 response:", JSON.stringify(response, null, 2));
        return ''; // Empty facts - Stage 2 will proceed without context
      }

      // Normalize whitespace and enforce character cap strictly
      const raw = candidate.content.parts[0].text.trim().replace(/\s+/g, ' ');
      const clipped = raw.length > CHAR_LIMIT ? raw.slice(0, CHAR_LIMIT).trim() : raw;
      console.log(`   The raw response was: "${raw}"`);
      console.log(`   ✅ Gathered facts (${clipped.length} chars, cap=${CHAR_LIMIT}): "${clipped}..."`);
      return clipped;
    } catch (error) {
      console.warn(`⚠️  Stage 1 error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log(`   🔄 Proceeding to Stage 2 without additional context`);
      return ''; // Empty facts - Stage 2 will proceed without context
    }
  }

  /**
   * Decide whether Stage 1 search should be used for a topic
   * Heuristic: prefer search only for specific entities or time-sensitive/superlatives
   * @param topic - The input topic
   * @returns boolean - true if we should enable search tools
   */
  private shouldSearch(topic: string): boolean {
    const decision = shouldSkipSearch(topic);
    console.log(`🔎 Search decision: ${decision.skip ? 'skip' : 'search'} (reason: ${decision.reason})`);
    return !decision.skip;
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
    console.log(`   📄 Using facts: ${facts ? `"${facts}..."` : 'None (basic prompt)'}`);
    
    const difficultyDescription = this.getDifficultyDescription(request.difficulty);
    
    const sections = [
      // Core instructions
      GeminiService.CORE_INSTRUCTIONS,
      
      // Task specification
      `Your task is to generate a single, specific, **non-meta** trivia question about "${topic}" with ${difficultyDescription} difficulty (${request.difficulty}/5).`
    ];

    // Add facts if available
    if (facts && facts.trim()) {
      sections.push(`**Context facts**: ${facts}`);
      sections.push(`Only use these facts if they make the question more precise; otherwise ignore.`);
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
      // Stage 1: Decide whether to search and gather facts accordingly
      const useSearch = this.shouldSearch(request.topic);
      console.log(`🔎 Search enabled: ${useSearch} (topic: "${request.topic}")`);
      const facts = useSearch ? await this.gatherFacts(request.topic, true) : '';
      
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