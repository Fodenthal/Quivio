/**
 * Shared types for Gemini-based trivia question generation.
 */

import type { QuestionContentFormat } from "@shared/index";

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
  /** Optional database identifier when sourced from persistent storage. */
  questionId?: number | string;
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
  /** Optional per-question round duration in milliseconds. */
  roundTimeMs?: number;
  /** Web search queries used during fact gathering (if any). */
  webSearchQueries?: string[];
  /** Raw fact-gathering response for similarity detection. */
  rawFactResponse?: string;
  /** Formatting hint for client rendering (plain vs LaTeX). */
  format?: QuestionContentFormat;
  /** Taxonomy family identifier that produced this question, when known. */
  familyId?: string;
  /** Specific phrasing template identifier within the family. */
  templateId?: string;
  /** Normalized parameter payload used to instantiate the template. */
  paramValues?: Record<string, unknown>;
  /** Deterministic hash of paramValues for uniqueness checks. */
  paramsHash?: string;
  /** Deterministic hash of normalized question/answer content. */
  contentHash?: string;
  /** Canonical difficulty band label (D1–D5). */
  difficultyBand?: string;
  /** Source label describing how the question was generated or ingested. */
  generationSource?: string;
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
