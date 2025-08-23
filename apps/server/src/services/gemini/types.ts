/**
 * Shared types for Gemini-based trivia question generation.
 */

/**
 * Structured output for a generated trivia question.
 */
export interface GeneratedQuestion {
  /** The trivia question text. */
  question: string;
  /** The primary factual answer. */
  correctAnswer: string;
  /** All acceptable answer variants. */
  acceptableAnswers: string[];
  /** Broad category (Sports, History, Science, Film, etc.). */
  category: string;
  /** Difficulty on a 1-5 scale. */
  difficulty: number;
  /** Web search queries used during fact gathering (if any). */
  webSearchQueries?: string[];
  /** Raw fact-gathering response for similarity detection. */
  rawFactResponse?: string;
}

/**
 * Input describing a request to generate a trivia question.
 */
export interface QuestionRequest {
  /** Topic or domain for the question. */
  topic: string;
  /** Desired difficulty on a 1-5 scale. */
  difficulty: number;
  /** Previous questions to avoid duplicates (concepts or wording). */
  previousQuestions?: string[];
  /** Previous search queries to avoid duplicates in fact gathering. */
  previousSearchQueries?: string[];
  /** Previous answers to encourage fact diversity beyond just query variation. */
  previousAnswers?: string[];
  /** Previous raw fact-gathering responses for repetition detection. */
  previousRawResponses?: string[];
}


