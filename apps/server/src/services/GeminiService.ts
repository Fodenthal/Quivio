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
  difficulty: number; // 1-10 scale
  previousQuestions?: string[]; // To avoid duplicates
}

/**
 * Service for generating trivia questions using Google Gemini API
 * Handles question generation with multiple acceptable answer variants
 */
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Gemini API key is required");
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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
    
    let prompt = `Generate a trivia question about "${request.topic}" with ${difficultyDescription} difficulty (${request.difficulty}/10).

Requirements:
1. Create a clear, factual question that has a definitive answer
2. The question should NOT be open-ended or subjective
3. The question must be under 65 tokens
4. Provide the main correct answer
5. List ALL possible acceptable variations of the answer, including:
   - Abbreviations (e.g., "USA" for "United States of America")
   - Shortened forms (e.g., "Einstein" for "Albert Einstein")
   - Common misspellings that are close enough
   - Alternative names or titles
   - Numbers in both digit and word form (e.g., "10" and "ten")
   - For proper nouns: allow partial matches where logical (e.g., "Stuyvesant" for "Stuyvesant High School" but NOT "High School" for "Stuyvesant High School")
   - For character names: first names when context is clear (e.g., "Lydia" for "Lydia Bennet" in Pride and Prejudice context)

Return your response in this EXACT JSON format:
{
  "question": "Your question here",
  "correctAnswer": "The primary correct answer",
  "acceptableAnswers": ["answer1", "answer2", "answer3"],
  "category": "The category this question belongs to"
}

Example for topic "Harry Potter" with difficulty 3:
{
  "question": "What is the name of Harry Potter's pet owl?",
  "correctAnswer": "Hedwig",
  "acceptableAnswers": ["Hedwig", "hedwig"],
  "category": "Literature"
}

Important: Return ONLY the JSON object, no additional text.`;

    if (request.previousQuestions && request.previousQuestions.length > 0) {
      prompt += `\n\nAvoid creating questions similar to these previous ones: ${request.previousQuestions.join(", ")}`;
    }

    return prompt;
  }

  /**
   * Parse the Gemini API response into a structured question object
   */
  private parseResponse(response: string, request: QuestionRequest): GeneratedQuestion {
    try {
      // Clean the response - remove any markdown formatting or extra text
      const cleanResponse = response.trim().replace(/```json\n?|\n?```/g, '');
      
      const parsed = JSON.parse(cleanResponse);
      
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
    if (difficulty <= 2) return "very easy";
    if (difficulty <= 4) return "easy";
    if (difficulty <= 6) return "medium";
    if (difficulty <= 8) return "hard";
    return "very hard/expert";
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