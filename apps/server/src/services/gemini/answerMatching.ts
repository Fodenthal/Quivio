import { WordTokenizer } from 'natural';
import { removeStopwords, eng } from 'stopword';
import { compareNumericAnswers, parseNumericAnswer, ParsedNumericAnswer } from './numericAnswer';

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
export function isAnswerAcceptable(userAnswer: string, acceptableAnswers: string[], canonicalAnswer?: string): boolean {
  if (!userAnswer?.trim()) {
    return false;
  }

  const uniqueAnswers = new Set<string>();
  if (typeof canonicalAnswer === 'string' && canonicalAnswer.trim().length > 0) {
    uniqueAnswers.add(canonicalAnswer);
  }
  for (const answer of acceptableAnswers || []) {
    if (typeof answer === 'string' && answer.trim().length > 0) {
      uniqueAnswers.add(answer);
    }
  }

  if (uniqueAnswers.size === 0) {
    return false;
  }

  const candidates = Array.from(uniqueAnswers);

  const userNumeric = parseNumericAnswer(userAnswer);
  if (userNumeric) {
    const numericTargets = candidates
      .map(candidate => parseNumericAnswer(candidate))
      .filter((parsed): parsed is ParsedNumericAnswer => parsed !== null);

    if (numericTargets.length > 0) {
      if (numericTargets.some(target => compareNumericAnswers(userNumeric, target))) {
        return true;
      }
    }
  }

  const userTokens = new Set(tokenize(userAnswer));
  if (userTokens.size === 0) {
    return false;
  }

  return candidates.some(acceptableAnswer => {
    const acceptableTokens = tokenize(acceptableAnswer);
    if (acceptableTokens.length === 0) {
      return false;
    }
    return acceptableTokens.every(token => userTokens.has(token));
  });
}

/**
 * @deprecated Use isAnswerAcceptable instead - kept for backward compatibility
 */
export function normalizeAnswer(answer: string): string {
  return normalizeText(answer);
}
