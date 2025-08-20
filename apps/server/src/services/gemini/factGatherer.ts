import { GoogleGenAI } from '@google/genai';

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
  previousQueries: string[] = []
): Promise<string> {
  console.log(`🔍 Stage 1: Gathering facts for topic: "${topic}"`);

  const CHAR_LIMIT = 400;
  
  // Build previous queries context if we have any
  const previousQueriesContext = previousQueries.length > 0 
    ? `\n\nPrevious search queries to avoid similar angles:\n${previousQueries.join(', ')}\n\nUse a different search approach that explores fresh aspects of "${topic}".`
    : '';

  const factGatheringPrompt = `
You are a master researcher for a trivia game. SEARCH IS REQUIRED for: "${topic}".

OBJECTIVE
- Use the Google Search tool to find concrete, testable facts.
- Prefer fresh, interesting angles over generic summaries.${previousQueriesContext}

OUTPUT CONSTRAINTS (hard):
- EXACTLY 1–2 sentences, plain text only, TOTAL ≤ ${CHAR_LIMIT} characters.
- No lists/bullets/markdown/quotes/citations. No parentheticals unless part of a proper name.

PROCEDURE
1) Issue one or more search queries targeting different angles if needed.
2) Skim results and extract 1–2 specific facts suitable for trivia.
3) Synthesize into 1–2 sentences within the character cap.

Return ONLY the 1–2 sentence summary.`;

  console.log(`Previous queries context: ${previousQueries.length} queries to avoid`);
  if (previousQueries.length > 0) {
    console.log(`   Avoiding: ${previousQueries.slice(0, 3).join(', ')}${previousQueries.length > 3 ? '...' : ''}`);
  }

  try {
    const request: any = {
      model: 'gemini-2.5-flash',
      contents: factGatheringPrompt,
      config: {
        temperature: 0,
        topP: 1.0,
        topK: 1.0,
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
    console.log(`Stage 1 response: ${JSON.stringify(response, null, 2)}`);

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts?.[0]?.text) {
      return '';
    }

    // Extract webSearchQueries from metadata if available
    const webSearchQueries = (candidate as any)?.metadata?.webSearchQueries || [];
    if (webSearchQueries.length > 0) {
      console.log(`🔍 Extracted ${webSearchQueries.length} search queries:`, webSearchQueries);
      console.log(`   First query: "${webSearchQueries[0]}"`);
    } else {
      console.log(`   No webSearchQueries found in metadata`);
    }

    // Normalize whitespace and enforce character cap strictly
    const raw = candidate.content.parts[0].text.trim().replace(/\s+/g, ' ');
    const clipped = raw.length > CHAR_LIMIT ? raw.slice(0, CHAR_LIMIT).trim() : raw;
    console.log(`   The raw response was: "${raw}"`);
    console.log(`   Gathered facts (${clipped.length} chars, cap=${CHAR_LIMIT}): "${clipped}..."`);
    return clipped;
  } catch (error) {
    console.warn(` Stage 1 error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.log(`  Proceeding to Stage 2 without additional context`);
    return '';
  }
}


