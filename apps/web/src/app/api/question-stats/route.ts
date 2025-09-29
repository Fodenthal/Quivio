import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const CACHE_TTL_SECONDS = 60;

interface QuestionsStatsResponse {
  totalQuestions: number;
  updatedAt: string;
}

let cachedStats: QuestionsStatsResponse | null = null;
let lastFetchTime = 0;

const getSupabaseClient = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn("Question stats API missing SUPABASE_URL or key env vars.");
    return null;
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const fetchQuestionCount = async (): Promise<QuestionsStatsResponse> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Supabase client not configured");
  }

  const { data, error, count } = await client
    .from("questions")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  return {
    totalQuestions: count ?? data?.length ?? 0,
    updatedAt: new Date().toISOString(),
  };
};

export async function GET() {
  try {
    const now = Date.now();
    if (cachedStats && now - lastFetchTime < CACHE_TTL_SECONDS * 1000) {
      return NextResponse.json(cachedStats, {
        headers: {
          "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}`,
        },
      });
    }

    const stats = await fetchQuestionCount();
    cachedStats = stats;
    lastFetchTime = now;

    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}`,
      },
    });
  } catch (error) {
    console.error("Failed to fetch question stats", error);
    return NextResponse.json({ totalQuestions: null }, { status: 500 });
  }
}
