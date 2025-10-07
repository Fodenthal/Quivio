import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { ParentTopicOverview } from "@/types/topics";

const CACHE_TTL_SECONDS = 60;

let cachedTopics: ParentTopicOverview[] | null = null;
let lastFetchTime = 0;

const getSupabaseClient = (): SupabaseClient | null => {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn("parent-topics API missing SUPABASE credentials");
    return null;
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

interface SupabaseParentTopicRow {
  tag_id: number;
  slug: string;
  display_name: string;
  child_count: number | null;
  question_count: number | null;
}

const PRIORITY_SLUGS = ["geography", "entertainment"] as const;

const fetchParentTopics = async (): Promise<ParentTopicOverview[]> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Supabase client unavailable");
  }

  const { data, error } = await client.rpc("get_parent_topic_overview", { limit_count: 24 });

  if (error) {
    throw error;
  }

  return (data || []).map((entry: SupabaseParentTopicRow) => ({
    tagId: entry.tag_id,
    slug: entry.slug,
    displayName: entry.display_name,
    childCount: entry.child_count ?? 0,
    questionCount: entry.question_count ?? 0,
  }));
};

export async function GET() {
  try {
    const now = Date.now();
    if (cachedTopics && now - lastFetchTime < CACHE_TTL_SECONDS * 1000) {
      return NextResponse.json(cachedTopics, {
        headers: {
          "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}`,
        },
      });
    }

    const topics = await fetchParentTopics();

    // Ensure priority slugs are always present
    const seen = new Map(topics.map(topic => [topic.slug.toLowerCase(), topic]));

    const missingPriorities = PRIORITY_SLUGS.filter(slug => !seen.has(slug));

    if (missingPriorities.length > 0) {
      const client = getSupabaseClient();
      if (client) {
        const { data, error } = await client
          .from("tags")
          .select("id, slug, display_name")
          .in("slug", missingPriorities);

        if (error) {
          console.warn("Failed to fetch priority parent topics", error);
        } else if (Array.isArray(data)) {
          data.forEach(row => {
            const slug = String(row.slug || "").toLowerCase();
            if (slug && !seen.has(slug)) {
              const fallback: ParentTopicOverview = {
                tagId: row.id ?? -Math.random(),
                slug,
                displayName: row.display_name ?? slug,
                childCount: 0,
                questionCount: 0,
              };
              seen.set(slug, fallback);
            }
          });
        }
      }
    }

    const prioritySet = new Set<string>(PRIORITY_SLUGS);
    const orderedTopics: ParentTopicOverview[] = [];

    PRIORITY_SLUGS.forEach(slug => {
      const topic = seen.get(slug);
      if (topic) orderedTopics.push(topic);
    });

    Array.from(seen.values()).forEach(topic => {
      const slug = topic.slug.toLowerCase();
      if (!prioritySet.has(slug)) {
        orderedTopics.push(topic);
      }
    });

    const mergedTopics = orderedTopics;
    cachedTopics = mergedTopics;
    lastFetchTime = now;

    return NextResponse.json(mergedTopics, {
      headers: {
        "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}`,
      },
    });
  } catch (error) {
    console.error("Failed to fetch parent topics overview", error);
    return NextResponse.json([], { status: 500 });
  }
}
