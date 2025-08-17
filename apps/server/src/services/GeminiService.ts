import { GoogleGenAI } from "@google/genai";
import { WordTokenizer } from 'natural';
import { shouldSkipSearch } from './SearchDecision';
import { gatherFacts } from './gemini/factGatherer';
import { formatQuestion } from './gemini/formatter';
import { isAnswerAcceptable as acceptAnswer, normalizeAnswer as normalizeAns } from './gemini/answerMatching';
import type { GeneratedQuestion, QuestionRequest } from './gemini/types';
export type { GeneratedQuestion, QuestionRequest };

/**
 * Service for generating trivia questions using Google Gemini API
 * Handles question generation with multiple acceptable answer variants
 */
export class GeminiService {
  private ai: GoogleGenAI;


  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Gemini API key is required");
    }
    
    this.ai = new GoogleGenAI({apiKey: apiKey});
  }

  // Stage 1 is delegated to gemini/factGatherer.ts
  private async gatherFacts(topic: string, enableSearchTools: boolean): Promise<string> {
    return gatherFacts(topic, enableSearchTools, this.ai);
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

  // Stage 2 is delegated to gemini/formatter.ts
  private async formatQuestion(topic: string, facts: string, request: QuestionRequest): Promise<GeneratedQuestion> {
    return formatQuestion(topic, facts, request, this.ai);
  }

  /**
   * Generate a trivia question using two-stage approach
   * @param request - The question generation request
   * @returns Promise<GeneratedQuestion> - The generated question with acceptable answers
   */
  async generateQuestion(request: QuestionRequest): Promise<GeneratedQuestion> {
    const startTime = Date.now();
    console.log(`Starting two-stage question generation for topic: "${request.topic}"`);
    console.log(`Difficulty: ${request.difficulty}/5 (${this.getDifficultyDescription(request.difficulty)})`);
    
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
   * Check if an answer matches any of the acceptable answers using enhanced token-based matching
   * @param userAnswer - The user's submitted answer
   * @param acceptableAnswers - Array of acceptable answer variations
   * @returns boolean - Whether the answer is acceptable
   */
  static isAnswerAcceptable(userAnswer: string, acceptableAnswers: string[]): boolean {
    return acceptAnswer(userAnswer, acceptableAnswers);
  }

  /**
   * @deprecated Use isAnswerAcceptable instead - kept for backward compatibility
   */
  static normalizeAnswer(answer: string): string {
    return normalizeAns(answer);
  }
} 