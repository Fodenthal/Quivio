import {Type} from "@google/genai";


    /**
 * Prompt fragments and JSON schema used for Gemini question generation.
 */

export const QUESTION_SCHEMA_SDK = {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING, description: "The trivia question text." },
      correctAnswer: { type: Type.STRING, description: "The primary factual answer." },
      acceptableAnswers: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "All acceptable answer variants."
      },
      category: {
        type: Type.STRING,
        description: "Broad category (Sports, History, Science, Film, etc.)."
      }
    },
    required: ["question", "correctAnswer", "acceptableAnswers", "category"],
    // Keeps field order stable (recommended):
    propertyOrdering: ["question", "correctAnswer", "acceptableAnswers", "category"]
  } as const;



