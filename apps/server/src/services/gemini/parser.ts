import { GeneratedQuestion, QuestionRequest } from './types';

/**
 * Parse the Gemini API response into a structured question object.
 * Mirrors the existing logic including code-fence stripping and validations.
 *
 * @param response - Raw text returned by the model
 * @param request - Original request to carry difficulty forward
 * @throws Error on invalid JSON or missing required fields
 */
export function parseResponse(response: string, request: QuestionRequest): GeneratedQuestion {
  console.log(`🔍 Starting response parsing...`);
  console.log(`   📄 Raw response length: ${response.length} characters`);

  try {
    // Clean up markdown wrapper if present (SDK often wraps JSON in code blocks)
    let cleanResponse = response.trim();
    console.log(`   🧹 Cleaning response format...`);

    if (cleanResponse.startsWith('```json') && cleanResponse.endsWith('```')) {
      cleanResponse = cleanResponse.slice(7, -3).trim();
      console.log(`   ✅ Removed JSON code block wrapper`);
    } else if (cleanResponse.startsWith('```') && cleanResponse.endsWith('```')) {
      cleanResponse = cleanResponse.slice(3, -3).trim();
      console.log(`   ✅ Removed generic code block wrapper`);
    } else {
      console.log(`   ℹ️  No code block wrapper detected`);
    }

    console.log(`   📝 Cleaned response preview: "${cleanResponse.substring(0, 100)}..."`);

    // Parse JSON
    console.log(`   🔍 Attempting JSON parsing...`);
    const parsed = JSON.parse(cleanResponse);
    console.log(`   ✅ JSON parsed successfully`);

    // Validate required fields
    console.log(`   🔍 Validating required fields...`);
    const requiredFields = ['question', 'correctAnswer', 'acceptableAnswers'];
    const missingFields = requiredFields.filter(field => !parsed[field]);

    if (missingFields.length > 0) {
      console.error(`   ❌ Missing required fields: ${missingFields.join(', ')}`);
      throw new Error(`Missing required fields in API response: ${missingFields.join(', ')}`);
    }
    console.log(`   ✅ All required fields present`);

    // Ensure acceptableAnswers is an array and includes the correct answer
    console.log(`   🔍 Processing acceptable answers...`);
    let acceptableAnswers = Array.isArray(parsed.acceptableAnswers) ? parsed.acceptableAnswers : [parsed.correctAnswer];
    console.log(`   📋 Initial acceptable answers: [${acceptableAnswers.join(', ')}]`);

    const correctAnswerLower = parsed.correctAnswer.toLowerCase();
    const hasCorrectAnswer = acceptableAnswers.some((ans: string) => ans.toLowerCase() === correctAnswerLower);

    if (!hasCorrectAnswer) {
      console.log(`   ➕ Adding correct answer to acceptable answers list`);
      acceptableAnswers.unshift(parsed.correctAnswer);
    } else {
      console.log(`   ✅ Correct answer already in acceptable answers`);
    }

    // Normalize acceptable answers
    console.log(`   🔧 Normalizing acceptable answers...`);
    acceptableAnswers = acceptableAnswers.map((ans: string) => ans.trim());
    console.log(`   📋 Final acceptable answers (${acceptableAnswers.length}): [${acceptableAnswers.join(', ')}]`);

    const result: GeneratedQuestion = {
      question: parsed.question.trim(),
      correctAnswer: parsed.correctAnswer.trim(),
      acceptableAnswers,
      category: parsed.category || 'General',
      difficulty: request.difficulty
    };

    console.log(`   ✅ Successfully parsed and validated question structure`);
    console.log(`   📊 Final question stats: category="${result.category}", difficulty=${result.difficulty}`);

    return result;
  } catch (error) {
    console.error("❌ Failed to parse Gemini response");
    console.error(`   📄 Response that failed to parse: "${response}"`);
    console.error(`   🔍 Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw new Error(`Failed to parse question response: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
  }
}


