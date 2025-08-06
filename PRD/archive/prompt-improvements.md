
Prompt Tweaks to Boost Trivia‑Question Quality

> **Goal:** Achieve "good-enough" question quality for most topics with minimal prompt overhead. Each tweak is high-impact, low-bloat, and fits the `buildPrompt` + Gemini API flow.

---

# Quick Reference

## JSON Schema
```json
{
  "question": "string",
  "correctAnswer": "string",
  "acceptableAnswers": ["string"],
  "category": "string",
  "difficulty": "number"
}
```

## Rules (Ultra-Dense)
- Factual, unambiguous, single-answer
- No yes/no, definition, list, meta, or opinion questions
- Not overly broad, not a riddle, not real-time unless topic is time-specific
- <65 tokens
- AcceptableAnswers: include abbreviations, misspellings, alternate names, number/word forms if relevant
- difficulty: integer 1-5, matches requested

## Sample Prompt
```
Generate ONE trivia question about "${topic}" at difficulty ${difficulty}/5.

Return ONLY a JSON object matching this schema:
{
  "question": string,
  "correctAnswer": string,
  "acceptableAnswers": string[],
  "category": string,
  "difficulty": number
}

Rules:
• Factual, unambiguous, single-answer
• No yes/no, definition, list, meta, or opinion questions
• Not overly broad, not a riddle, not real-time unless topic is time-specific
• <65 tokens
• AcceptableAnswers: include abbreviations, misspellings, alternate names, number/word forms if relevant
• difficulty: integer 1-5, matches requested

If your draft breaks any rule above, immediately replace it with a compliant version before returning.
```

---

## 1. Structured Output (JSON Function Call)
- Use Gemini's function call mode with this schema:
```json
{
  "name": "trivia_question",
  "parameters": {
    "question": "string",
    "correctAnswer": "string",
    "acceptableAnswers": ["string"],
    "category": "string",
    "difficulty": "number"
  }
}
```

---

## Few-Shot JSON Examples (Copy-Paste Ready)
```jsonc
// Science, easy
{"question":"Which element has the symbol 'Au'?","correctAnswer":"Gold","acceptableAnswers":["Gold","gold"],"category":"Science","difficulty":1}

// Literature, medium
{"question":"Who wrote 'Pride and Prejudice'?","correctAnswer":"Jane Austen","acceptableAnswers":["Jane Austen","Austen"],"category":"Literature","difficulty":3}

// Sports, hard
{"question":"Which country won the first FIFA World Cup in 1930?","correctAnswer":"Uruguay","acceptableAnswers":["Uruguay"],"category":"Sports","difficulty":5}
```

---

## Quality & Self-Critique Checklist (Copy-Paste)
```
Rules:
• Factual, unambiguous, single-answer
• No yes/no, definition, list, meta, or opinion questions
• Not overly broad, not a riddle, not real-time unless topic is time-specific
• <65 tokens
• AcceptableAnswers: include abbreviations, misspellings, alternate names, number/word forms if relevant
• difficulty: integer 1-5, matches requested

Self-Critique:
If your draft breaks any rule above, immediately replace it with a compliant version before returning.
```

---

## 5. Difficulty Scaling (Reference Only)
```
Difficulty 1: very common; 3: college/hobbyist; 5: expert/specialist
```

---

## Reference Prompt (Inject as user message)
```
Generate ONE trivia question about "${topic}" at difficulty ${difficulty}/5.

[Insert 2-3 JSON examples above]

Rules:
• Factual, unambiguous, single-answer
• No yes/no, definition, list, meta, or opinion questions
• Not overly broad, not a riddle, not real-time unless topic is time-specific
• <65 tokens
• AcceptableAnswers: include abbreviations, misspellings, alternate names, number/word forms if relevant
• difficulty: integer 1-5, matches requested

If your draft breaks any rule above, immediately replace it with a compliant version before returning.

Return ONLY a JSON object matching this schema:
{
  "question": string,
  "correctAnswer": string,
  "acceptableAnswers": string[],
  "category": string,
  "difficulty": number
}
```
