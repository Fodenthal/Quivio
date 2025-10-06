import { useEffect, useState } from "react";
import type { ParentTopicOverview } from "@/types/topics";

interface UseParentTopicsResult {
  topics: ParentTopicOverview[];
  loading: boolean;
  error: Error | null;
}

const FALLBACK_TOPICS: ParentTopicOverview[] = [
  { tagId: -1, slug: "geography", displayName: "Geography", childCount: 0, questionCount: 0 },
  { tagId: -2, slug: "entertainment", displayName: "Entertainment", childCount: 0, questionCount: 0 },
  { tagId: -3, slug: "history", displayName: "History", childCount: 0, questionCount: 0 },
  { tagId: -4, slug: "science", displayName: "Science", childCount: 0, questionCount: 0 },
];

export function useParentTopics(): UseParentTopicsResult {
  const [topics, setTopics] = useState<ParentTopicOverview[]>(FALLBACK_TOPICS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchTopics = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/parent-topics", {
          method: "GET",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to load parent topics (${response.status})`);
        }

        const payload = (await response.json()) as ParentTopicOverview[];

        if (Array.isArray(payload) && payload.length > 0) {
          setTopics(payload);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        const error = err instanceof Error ? err : new Error("Unknown error fetching parent topics");
        setError(error);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchTopics();

    return () => controller.abort();
  }, []);

  return { topics, loading, error };
}

