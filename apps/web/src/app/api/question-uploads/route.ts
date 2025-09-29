import { NextResponse } from "next/server";
import { validateSubmission } from "@/utils/questionSubmission";
import { storeSubmissions, fetchRecentSubmissions } from "./store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.min(Math.max(Number(limitParam), 1), 100) : 15;

  try {
    console.log(`📥 Fetching recent question submissions (limit=${limit})`);
    const submissions = await fetchRecentSubmissions(limit);
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("Failed to fetch submission history", error);
    return NextResponse.json({ error: "Failed to load submissions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log("📨 Incoming question submission", payload);
    const validation = validateSubmission(payload);

    if (!validation.success || !validation.submission) {
      console.warn("🚫 Question submission failed validation", validation.errors);
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: validation.errors,
        },
        { status: 400 },
      );
    }

    const result = await storeSubmissions([validation.submission], "single", null);
    console.log("✅ Submission stored", result.stored.map((record) => ({ id: record.id, origin: record.origin, status: record.status })));

    return NextResponse.json(
      {
        stored: result.stored,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to store question submission", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred while saving your question.",
      },
      { status: 500 },
    );
  }
}
