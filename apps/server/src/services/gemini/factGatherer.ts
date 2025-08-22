import { GoogleGenAI } from '@google/genai';
import { distance } from 'fastest-levenshtein';
import { Logger } from '../../utils/logger';

/**
 * Check if a query is too similar to any previous queries using Levenshtein distance.
 * @param newQuery - The query to check
 * @param previousQueries - Array of previous queries to compare against
 * @param threshold - Minimum character difference required (default: 4)
 * @returns true if the query is too similar to any previous query
 */
function isQueryTooSimilar(newQuery: string, previousQueries: string[], threshold: number = 4): boolean {
  if (previousQueries.length === 0) return false;
  
  const normalizedNew = newQuery.trim().toLowerCase();
  return previousQueries.some(prevQuery => {
    const normalizedPrev = prevQuery.trim().toLowerCase();
    const editDistance = distance(normalizedNew, normalizedPrev);
    return editDistance < threshold;
  });
}

/**
 * Filter previous queries to only include those that are sufficiently different.
 * This helps create a more diverse and efficient context for the prompt.
 * @param queries - Array of previous queries
 * @param minDifference - Minimum character difference between queries (default: 3)
 * @returns Filtered array with only sufficiently different queries
 */
function filterSimilarQueries(queries: string[], minDifference: number = 3): string[] {
  if (queries.length <= 1) return queries;
  
  const filtered: string[] = [];
  for (const query of queries) {
    if (!isQueryTooSimilar(query, filtered, minDifference)) {
      filtered.push(query);
    }
  }
  return filtered;
}

/**
 * Split text into sentences for similarity analysis.
 * Uses simple sentence boundary detection for factual content.
 * @param text - Text to split into sentences
 * @returns Array of cleaned sentences
 */
function splitIntoSentences(text: string): string[] {
  if (!text || text.trim().length === 0) return [];
  
  // Split on sentence boundaries: period, exclamation, question mark followed by space or end
  const sentences = text
    .split(/[.!?]+\s+|[.!?]+$/)
    .map(s => s.trim())
    .filter(s => s.length > 10); // Filter out very short fragments
  
  return sentences;
}

/**
 * Check if a sentence is too similar to any sentence in a list.
 * @param sentence - The sentence to check
 * @param existingSentences - Array of existing sentences to compare against
 * @param threshold - Maximum allowed edit distance for similarity (default: 0.7 = 30% similarity required for match)
 * @returns true if the sentence is too similar to any existing sentence
 */
function isSentenceTooSimilar(sentence: string, existingSentences: string[], threshold: number = 0.7): boolean {
  if (existingSentences.length === 0) return false;
  
  const normalizedSentence = sentence.trim().toLowerCase();
  
  return existingSentences.some(existing => {
    const normalizedExisting = existing.trim().toLowerCase();
    const editDistance = distance(normalizedSentence, normalizedExisting);
    const maxLength = Math.max(normalizedSentence.length, normalizedExisting.length);
    
    // Calculate similarity ratio (0 = identical, 1 = completely different)
    const similarityRatio = editDistance / maxLength;
    
    return similarityRatio <= threshold;
  });
}

/**
 * Detect repeated content between a new response and previous responses.
 * Returns sentences from the new response that are too similar to previous content.
 * @param newResponse - The new raw response to check
 * @param previousResponses - Array of previous raw responses
 * @param threshold - Similarity threshold (default: 0.7 = 30% similarity required for match)
 * @returns Array of repeated sentences that should be avoided
 */
function detectRepeatedContent(newResponse: string, previousResponses: string[], threshold: number = 0.7): string[] {
  if (!newResponse || previousResponses.length === 0) return [];
  
  const newSentences = splitIntoSentences(newResponse);
  const allPreviousSentences = previousResponses.flatMap(splitIntoSentences);
  
  const repeatedSentences: string[] = [];
  
  for (const sentence of newSentences) {
    if (isSentenceTooSimilar(sentence, allPreviousSentences, threshold)) {
      repeatedSentences.push(sentence);
    }
  }
  
  return repeatedSentences;
}

/**
 * Stage 1: Search-only factual context gathering with uniqueness tracking
 * Focuses on generating unique trivia content rather than avoiding search terms.
 *
 * @param topic - The topic to research (search is required for this call)
 * @param enableSearchTools - If true, allow model to use Google Search tool; otherwise, skip tools
 * @param ai - Pre-configured GoogleGenAI client
 * @param previousQueries - Previous search queries for reference (may be reused for different angles)
 * @param previousAnswers - Previous answers to ensure completely different content
 * @returns Concise factual summary (1–2 sentences) and the search queries used
 */
export async function gatherFacts(
  topic: string,
  enableSearchTools: boolean,
  ai: GoogleGenAI,
  previousQueries: string[] = [],
  previousAnswers: string[] = []
): Promise<{facts: string, webSearchQueries: string[]}> {
  Logger.ai('Starting fact gathering', { topic, enableSearchTools });

  const CHAR_LIMIT = 400;
  
  // Filter previous queries to only include sufficiently different ones
  const filteredPreviousQueries = filterSimilarQueries(previousQueries, 3);
  
  // Build previous queries context as guidance (not restrictions)
  const previousQueriesContext = filteredPreviousQueries.length > 0 
    ? `\n\nPrevious search queries for reference (you may reuse these terms but aim for different specific information):\n${filteredPreviousQueries.join(', ')}`
    : '';

  // Build previous answers context for fact diversity - this is the key constraint
  const previousAnswersContext = previousAnswers.length > 0
    ? `\n\nPrevious answers from this topic to ensure uniqueness:\n${previousAnswers.join(', ')}\n\nIMPORTANT: Find facts that would lead to COMPLETELY DIFFERENT answers than these. Focus on different aspects, time periods, people, places, or angles within "${topic}". The goal is unique trivia questions, not avoiding search terms.`
    : '';

    const factGatheringPrompt = `
You are a master researcher for a trivia game. SEARCH IS REQUIRED for: "${topic}".

SEARCH DISCIPLINE
- You may use up to TWO web search queries to gather comprehensive information.
- Start with ONE strategic search query that targets the most promising angle.
- If the first query provides sufficient specific, interesting facts that meet the quality bar below, you may stop there.
- If you need additional context or want to find a more compelling angle, use a SECOND search query.
- Maximum TWO searches total. Use them strategically to find the most interesting trivia-worthy information.

QUALITY BAR FOR “ADEQUATE” (stop after one query if these are satisfied)
- Contains at least one concrete, objectively verifiable detail (proper noun, named place/event/object, or uniquely identifiable description).
- Feels vivid/quirky/story-like (not a generic definition or bland statistic).
- Avoid dry numbers unless they make the fact striking.
- No hallucinations: each claim must be supported by something you just found.${previousQueriesContext}${previousAnswersContext}

OUTPUT CONSTRAINTS
- EXACTLY 1–2 sentences, plain text only, TOTAL ≤ ${CHAR_LIMIT} characters.
- No lists/bullets/markdown/quotes/citations. No parentheticals unless part of a proper name.

PROCEDURE
1) Perform your FIRST search query about "${topic}" targeting the most promising angle.
2) Evaluate if the results provide compelling, specific facts that meet the QUALITY BAR.
3) If satisfied with interesting, unique content, synthesize into 1–2 sentences and stop.
4) If you want richer context or a more compelling angle, perform a SECOND strategic search.
5) Synthesize the best findings from your search(es) into 1–2 sentences within the character cap.

Return ONLY the 1–2 sentence summary.
`;


  Logger.aiDebug('Previous context for uniqueness', {
    topic,
    totalQueries: previousQueries.length,
    filteredQueries: filteredPreviousQueries.length,
    referenceQueries: filteredPreviousQueries.slice(0, 3).join(', ') + (filteredPreviousQueries.length > 3 ? '...' : ''),
    previousAnswerCount: previousAnswers.length
  });

  try {
    const request: any = {
      model: 'gemini-2.5-flash',
      contents: factGatheringPrompt,
      config: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 2048,
        thinkingConfig: {
          thinkingBudget: 128
        }
      }
    };
    if (enableSearchTools) {
      request.config.tools = [{ googleSearch: {} }];
    }
    const response = await ai.models.generateContent(request);
    
    // Log the entire response object and web search data as requested
    Logger.aiDebug('Complete fact gathering response', {
      topic,
      response: response,
      rawResponseJson: JSON.stringify(response, null, 2)
    });

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts?.[0]?.text) {
      Logger.ai('No content found in response', { topic });
      return { facts: '', webSearchQueries: [] };
    }

    // Extract webSearchQueries from groundingMetadata if available
    const webSearchQueries = (candidate as any)?.groundingMetadata?.webSearchQueries || [];
    
    // Log web search information as requested
    if (webSearchQueries.length > 0) {
      Logger.ai('Web search queries extracted', {
        topic,
        queryCount: webSearchQueries.length,
        queries: webSearchQueries,
        firstQuery: webSearchQueries[0]
      });
      
      Logger.aiDebug('Search strategy analysis', {
        topic,
        queriesUsed: webSearchQueries,
        searchCount: webSearchQueries.length,
        approach: webSearchQueries.length === 1 ? 'single_focused_search' : 'dual_search_strategy'
      });
    } else {
      Logger.aiDebug('No web search queries found', { topic });
    }

    // Normalize whitespace and enforce character cap strictly
    const raw = candidate.content.parts[0].text.trim().replace(/\s+/g, ' ');
    const clipped = raw.length > CHAR_LIMIT ? raw.slice(0, CHAR_LIMIT).trim() : raw;
    
    Logger.ai('Facts gathered successfully', {
      topic,
      factsLength: clipped.length,
      characterCap: CHAR_LIMIT,
      wasClipped: raw.length > CHAR_LIMIT,
      webSearchCount: webSearchQueries.length
    });
    
    Logger.aiDebug('Raw fact response', { topic, rawResponse: raw, finalFacts: clipped });
    
    return { facts: clipped, webSearchQueries };
  } catch (error) {
    Logger.error('Fact gathering failed', error instanceof Error ? error : new Error(String(error)), { topic });
    return { facts: '', webSearchQueries: [] };
  }
}


