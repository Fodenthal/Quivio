import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Ensure this endpoint is only available in development
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(
      JSON.stringify({ error: "This endpoint is only available in development." }),
      { status: 403 }
    );
  }

  try {
    const { topic, difficulty } = await request.json();

    if (!topic || typeof difficulty !== "number") {
      return new NextResponse(
        JSON.stringify({ error: "Missing or invalid topic/difficulty." }),
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new NextResponse(
        JSON.stringify({ error: "Gemini API key is not configured on the server." }),
        { status: 500 }
      );
    }

    // Dynamically import dev-only dependency to avoid bundling in production
    const { GeminiService } = await import("../../../../../server/src/services/GeminiService");
    const { GeneratedQuestion } = await import("../../../../../server/src/services/GeminiService");
    const geminiService = new GeminiService(apiKey);

    const questionRequest = {
      topic,
      difficulty,
      previousQuestions: [], // For isolated testing, we don't need previous questions
    };

    const generatedQuestion: GeneratedQuestion = await geminiService.generateQuestion(
      questionRequest
    );

    return new NextResponse(JSON.stringify(generatedQuestion), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in test-question endpoint:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to generate question.", details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500 }
    );
  }
}
