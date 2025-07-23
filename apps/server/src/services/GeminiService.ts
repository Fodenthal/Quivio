import { GoogleGenerativeAI } from "@google/generative-ai";

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

  // JSON Schema for the expected response format
  private static readonly QUESTION_SCHEMA = `{
    "type": "object",
    "properties": {
      "question": { 
        "type": "string", 
        "description": "The trivia question. Must be under 65 tokens." 
      },
      "correctAnswer": { 
        "type": "string", 
        "description": "The primary, most accurate answer." 
      },
      "acceptableAnswers": { 
        "type": "array", 
        "items": { "type": "string" },
        "description": "A list of all possible acceptable variations of the answer (e.g., abbreviations, common misspellings, alternative names)."
      },
      "category": { 
        "type": "string", 
        "description": "The category this question belongs to (e.g., 'History', 'Science')." 
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
  private static readonly CORE_INSTRUCTIONS = `You are a master trivia creator, renowned for crafting fun, engaging, and challenging questions.

**Crucial Rule:** The question must be a direct challenge of knowledge *about* the topic, not a meta-question *about* the topic's context. 
For example, for the topic 'Quant Interviews', you must create an actual probability or logic puzzle, NOT a question about interview techniques or what employers value. 
The goal is always a fun, real trivia question.

Requirements:
- The question must be clear, factual, and under 65 tokens
- The answer must be unambiguous and not open-ended
- Provide the main correct answer and a list of all possible acceptable variations (abbreviations, common misspellings, alternative names, etc.)`;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Gemini API key is required");
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });
  }

  /**
   * Generate a trivia question based on topic and difficulty
   * @param request - The question generation request
   * @returns Promise<GeneratedQuestion> - The generated question with acceptable answers
   */
  async generateQuestion(request: QuestionRequest): Promise<GeneratedQuestion> {
    const prompt = this.buildPrompt(request);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseResponse(text, request);
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
        `**Avoid creating questions similar to these previous ones:**
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
   * Check if an answer matches any of the acceptable answers
   * @param userAnswer - The user's submitted answer
   * @param acceptableAnswers - Array of acceptable answer variations
   * @returns boolean - Whether the answer is acceptable
   */
  static isAnswerAcceptable(userAnswer: string, acceptableAnswers: string[]): boolean {
    const normalizedUserAnswer = this.normalizeAnswer(userAnswer);
    
    return acceptableAnswers.some(acceptable => {
      const normalizedAcceptable = this.normalizeAnswer(acceptable);
      return normalizedUserAnswer === normalizedAcceptable;
    });
  }

  /**
   * Normalize an answer for comparison (enhanced version of the original)
   * @param answer - The answer to normalize
   * @returns string - The normalized answer
   */
  static normalizeAnswer(answer: string): string {
    return answer
      .toLowerCase()
      .trim()
      // Remove common articles and filler words
      .replace(/^(the|a|an)\s+/i, '')
      .replace(/\s+(the|a|an)\s+/gi, ' ')
      // Remove punctuation except for important ones like periods in abbreviations
      .replace(/[^\w\s.]/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }
} 