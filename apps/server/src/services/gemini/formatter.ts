import { GoogleGenAI } from '@google/genai';
import { CORE_INSTRUCTIONS, QUESTION_SCHEMA_SDK } from './prompts';
import { GeneratedQuestion, QuestionRequest } from './types';
import { parseResponse } from './parser';

/**
 * Stage 2: Format facts into structured JSON question
 * Builds the prompt and calls the model, then parses with the same logic.
 */
export async function formatQuestion(topic: string, facts: string, request: QuestionRequest, ai: GoogleGenAI): Promise<GeneratedQuestion> {
  console.log(`Stage 2: Formatting question for topic: "${topic}"`);
  console.log(`Using facts: ${facts ? `"${facts}..."` : 'None (basic prompt)'}`);

  const difficultyDescription = getDifficultyDescription(request.difficulty);

  const sections: string[] = [
    CORE_INSTRUCTIONS,
    `Your task is to generate a single, specific, **non-meta** trivia question about "${topic}" with ${difficultyDescription} difficulty (${request.difficulty}/5).`
  ];

  if (facts && facts.trim()) {
    sections.push(`**Context facts**: ${facts}`);
    sections.push(`Only use these facts if they make the question more precise; otherwise ignore.`);
  }

  sections.push(`Return only the JSON object; no extra text.`);

  if (request.previousQuestions && request.previousQuestions.length > 0) {
    console.log(`Avoiding ${request.previousQuestions.length} previous questions`);
    sections.push(
      `**Avoid repeating**: (a) the same fact/answer concepts, and (b) highly similar wording or templates as in these prior questions:\n${request.previousQuestions.join(", ")}`
    );
  }

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


