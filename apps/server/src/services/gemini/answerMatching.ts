import { WordTokenizer } from 'natural';
import { removeStopwords, eng } from 'stopword';

/**
 * Utilities for answer normalization and acceptance matching.
 */

// Single tokenizer instance for consistent tokenization
const tokenizer = new WordTokenizer();

/**
 * Normalize text while preserving important punctuation in abbreviations
 * @param text - The text to normalize
 * @returns string - The normalized text
 */
export function normalizeText(text: string): string {
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
export function tokenize(answer: string): string[] {
  const normalizedText = normalizeText(answer);
  const tokens = tokenizer.tokenize(normalizedText) || [];
  // Remove stop words using the stopword library
  return removeStopwords(tokens, eng).filter(token => token.length > 0);
}

/**
 * Check if an answer matches any of the acceptable answers using enhanced token-based matching
 * @param userAnswer - The user's submitted answer
 * @param acceptableAnswers - Array of acceptable answer variations
 * @returns boolean - Whether the answer is acceptable
 */
export function isAnswerAcceptable(userAnswer: string, acceptableAnswers: string[]): boolean {
  if (!userAnswer?.trim() || !acceptableAnswers?.length) {
    return false;
  }

  const userTokens = new Set(tokenize(userAnswer));

  // Early return for empty user tokens after stop-word removal
  if (userTokens.size === 0) {
    return false;
  }

  return acceptableAnswers.some(acceptableAnswer => {
    const acceptableTokens = tokenize(acceptableAnswer);

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
export function normalizeAnswer(answer: string): string {
  return normalizeText(answer);
}


