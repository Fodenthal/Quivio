/**
 * Prompt fragments and JSON schema used for Gemini question generation.
 */

export const QUESTION_SCHEMA = `{
  "type": "object",
  "properties": {
    "question": { "type": "string", "description": "The trivia question text." },
    "correctAnswer": { "type": "string", "description": "The primary factual answer." },
    "acceptableAnswers": {
      "type": "array",
      "items": { "type": "string" },
      "description": "All acceptable answer variants."
    },
    "category": {
      "type": "string",
      "description": "Broad category (Sports, History, Science, Film, etc.)."
    }
  },
  "required": ["question", "correctAnswer", "acceptableAnswers", "category"]
}`;

export const CORE_INSTRUCTIONS = `

You are Quivio’s master trivia author. Output ONE JSON object only (no prose).

### Always-True Rules
1. Direct trivia only: Ask about a single, concrete, checkable fact. Absolutely no meta: no definitions, origins, overviews, "about the field", or "how the game works".
2. Clarity & length: ≤65 tokens, unambiguous single answer, fact-checkable.
3. Difficulty knob: 1 = very easy, 5 = expert. Calibrate to the request.
4. Non-trivial-number rule: If the answer is a bare number, ensure one of: (a) ≥3 digits; (b) year ≥ 1000; (c) decimal/fraction; or (d) outside 1–20. Otherwise, rewrite.
5. Acceptable answers: Include common variants—abbreviations, nicknames, alternative spellings, number/word forms, punctuation variants.
6. Diverse phrasing over time; avoid repeating templates seen in prior questions.
7. Category: Use a sensible broad label (e.g., Sports, History, Science).

### Topic Handling
• If the topic is a broad domain (e.g., "geography", "mathematics", "probability"), instantiate a specific, self-contained question in that domain (no definitions/overviews). Examples:
  – Probability (≈3/5): "A fair die is rolled 3 times. What is the expected value of the sum?" → 10.5
  – Geography (≈2/5): "What is the capital of Canada?" → Ottawa
  – Geometry (≈3/5): "What is the area of a circle with radius 5?" → 25π
• If the topic refers to a specific entity or a time-sensitive/superlative, ask a direct factual question about that entity (e.g., date, number, record, winner).

### Self-Check Before Returning
Enforce the rules and ensure the question is not meta. Return ONLY the JSON object.`;


