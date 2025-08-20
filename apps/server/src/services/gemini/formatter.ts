import { GoogleGenAI } from '@google/genai';
import { CORE_INSTRUCTIONS, QUESTION_SCHEMA_SDK } from './prompts';
import { GeneratedQuestion, QuestionRequest } from './types';
import { parseResponse } from './parser';

/**
 * Stage 2: Format facts into structured JSON question
 * Builds the prompt and calls the model, then parses with the same logic.
 */
export async function formatQuestion(topic: string, facts: string, request: QuestionRequest, ai: GoogleGenAI): Promise<GeneratedQuestion> {
  console.log(`📝 Stage 2: Formatting question for topic: "${topic}"`);
  console.log(`   Facts: ${facts ? `"${facts}..."` : 'None (basic prompt)'}`);
  console.log(`   Previous questions for this topic: ${request.previousQuestions?.length || 0}`);

  const difficultyDescription = getDifficultyDescription(request.difficulty);

  const sections: string[] = [
    // 1) Role & output
    `You are Quivio’s master trivia author. Output ONE JSON object only (no prose).`,
  
    // 2) Goal & taste (put first)
    `GOAL: Ask a single, concrete, **non-meta** trivia question about "${topic}" that is **memorable, vivid, and objectively checkable**. Prefer real-world, story-like details or surprising connections over dry stats.`,
  
    // 3) Context facts (highest priority signal)
    ...(facts && facts.trim()
      ? [
          `CONTEXT FACTS (highest priority; use only if they sharpen the question): ${facts}`
        ]
      : []),
  
    // 4) Duplicate avoidance (second priority)
    ...(request.previousQuestions?.length
      ? [
          `CRITICAL: Avoid duplicates with prior "${topic}" questions—do NOT reuse the same factual idea/answer, closely similar wording, or subtopics already covered.`,
          `Previous "${topic}" questions: ${request.previousQuestions.join(" | ")}`
        ]
      : []),
  
    // 5) Difficulty calibration (explicit)
    `DIFFICULTY: ${request.difficulty}/5 — ${difficultyDescription}. Calibrate specificity, required knowledge, and distractor pressure accordingly.`,
  
    // 6) Selection rubric (push away from numbers/dates)
    `SELECTION RUBRIC (in order): 
     1) Real-life quirks, anecdotes, firsts, bans, reversals, or unlikely connections tied to "${topic}".
     2) Concrete artifacts (places, titles, objects, lines of dialogue, design choices) with a single verifiable answer.
     3) Only include numbers/dates if they make the fact striking or are intrinsic to the concept; otherwise avoid numerical factoids.`,
  
    // 7) Always-True Rules (tightened)
    `Always-True Rules:
     1) Non-meta: no definitions, origins, overviews, or “about the field”.
     2) Clarity & brevity: ≤65 tokens, one unambiguous answer, fact-checkable.
     3) If the answer is a bare number or year, ensure it’s inherently interesting (≥3 digits, non-round, or carries meaning) **and** the question contains a vivid hook; otherwise reframe to a concrete noun or action.
     4) Include common variants as acceptable answers (abbreviations, spellings, number/word forms, punctuation).
     5) Vary phrasing over time; avoid repeating templates.
     6) Category: use a sensible broad label (e.g., Sports, History, Science).`,
  
    // 8) Topic handling (kept but trimmed)
    `Topic Handling: If "${topic}" is broad, instantiate a specific, self-contained question in that domain (no definitions). If it’s a specific entity or time-sensitive claim, ask a direct factual question about that entity.`,
  
    // 9) Internal selection instruction (silent)
    `Internally draft 2–3 candidate questions, pick the most vivid yet testable one, and discard the rest.`,
  
    // 10) Output constraint
    `Return only the JSON object; no extra text.`
  ];
  
  const prompt = sections.join('\n\n');
  
  console.log(`Stage 2 prompt length: ${prompt.length} characters`);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: QUESTION_SCHEMA_SDK,
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 1024,
        thinkingConfig: {
          thinkingBudget: 64
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('Invalid response structure from Stage 2');
    }
    console.log(`Stage 2 response length: ${text.length} characters`);

    return parseResponse(text, request);
  } catch (error) {
    console.error(`❌ Stage 2 error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw new Error(`Failed to format question: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get human-readable difficulty description
 */
function getDifficultyDescription(difficulty: number): string {
  if (difficulty <= 1) return 'very easy';
  if (difficulty <= 2) return 'easy';
  if (difficulty <= 3) return 'medium';
  if (difficulty <= 4) return 'hard';
  return 'very hard';
}


