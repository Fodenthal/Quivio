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
 * Stage 1: Search-only factual context gathering with query tracking
 * Enhanced to track web search queries and avoid duplicates.
 *
 * @param topic - The topic to research (search is required for this call)
 * @param enableSearchTools - If true, allow model to use Google Search tool; otherwise, skip tools
 * @param ai - Pre-configured GoogleGenAI client
 * @param previousQueries - Previous search queries to avoid duplicates (optional)
 * @returns Concise factual summary (1–2 sentences)
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
  
  // Build previous queries context if we have any
  const previousQueriesContext = filteredPreviousQueries.length > 0 
    ? `\n\nPrevious search queries to avoid similar angles:\n${filteredPreviousQueries.join(', ')}\n\nUse a different search approach that explores fresh aspects of "${topic}".`
    : '';

  // Build previous answers context for fact diversity
  const previousAnswersContext = previousAnswers.length > 0
    ? `\n\nPrevious answers from this topic to ensure fact diversity:\n${previousAnswers.join(', ')}\n\nFind facts that would lead to DIFFERENT answers than these. Focus on different aspects, time periods, people, or angles within "${topic}".`
    : '';

    const factGatheringPrompt = `
You are a master researcher for a trivia game. SEARCH IS REQUIRED for: "${topic}".

SEARCH DISCIPLINE (very important)
- Run EXACTLY ONE web search query first. Do not chain or batch multiple queries.
- Try to produce the final 1–2 sentence output using ONLY results from that single query.
- If—and only if—you cannot produce an adequate, specific, checkable 1–2 sentence fact that meets the quality bar below, you may run AT MOST ONE additional search query to fill the gap.
- Never exceed TWO total web search queries. If the first query is sufficient, STOP and produce the answer.

QUALITY BAR FOR “ADEQUATE” (stop after one query if these are satisfied)
- Contains at least one concrete, objectively verifiable detail (proper noun, named place/event/object, or uniquely identifiable description).
- Feels vivid/quirky/story-like (not a generic definition or bland statistic).
- Avoid dry numbers unless they make the fact striking.
- No hallucinations: each claim must be supported by something you just found.${previousQueriesContext}${previousAnswersContext}

OUTPUT CONSTRAINTS
- EXACTLY 1–2 sentences, plain text only, TOTAL ≤ ${CHAR_LIMIT} characters.
- No lists/bullets/markdown/quotes/citations. No parentheticals unless part of a proper name.

PROCEDURE
1) Perform ONE search query about "${topic}" from a fresh angle.
2) From that first query’s results, extract 1–2 specific, checkable facts that meet the QUALITY BAR.
3) If the first query’s results cannot meet the QUALITY BAR, perform ONE (and only one) additional search query targeted to the missing detail.
4) Synthesize into 1–2 sentences within the character cap.
5) If still inadequate after two queries, choose the best single specific fact you can support from what you found and state it.

Return ONLY the 1–2 sentence summary.
`;


  Logger.aiDebug('Query filtering results', {
    topic,
    totalQueries: previousQueries.length,
    filteredQueries: filteredPreviousQueries.length,
    avoidingQueries: filteredPreviousQueries.slice(0, 3).join(', ') + (filteredPreviousQueries.length > 3 ? '...' : ''),
    filteredOutCount: previousQueries.length - filteredPreviousQueries.length
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
      
      const firstQuery = webSearchQueries[0];
      const isSimilar = isQueryTooSimilar(firstQuery, previousQueries, 4);
      Logger.aiDebug('Query similarity check', {
        topic,
        newQuery: firstQuery,
        isSimilarToPrevious: isSimilar,
        threshold: 4
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


