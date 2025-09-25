/**
 * Shared types for Gemini-based trivia question generation.
 */

/**
 * Metadata describing an associated media asset for a question.
 */
export interface QuestionImageMetadata {
  /** Fetchable URL rendered by the client. */
  url: string;
  /** Optional human-friendly description for accessibility. */
  altText?: string;
  /** Intrinsic width in pixels when available. */
  width?: number;
  /** Intrinsic height in pixels when available. */
  height?: number;
  /** Optional attribution or licensing info. */
  attribution?: string;
  /** Optional source identifier (e.g. "Wikimedia", "User Upload"). */
  source?: string;
  /** MIME type such as "image/png" when known. */
  mime?: string;
  /** Original remote URL when mirroring an external asset. */
  original_url?: string;
  /** Storage key/path when hosted internally. */
  storage_key?: string;
}

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
  /** Optional image metadata for visual questions. */
  image?: QuestionImageMetadata | null;
  /** Topic that produced this question (used for logging/rotation). */
  sourceTopic?: string;
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
