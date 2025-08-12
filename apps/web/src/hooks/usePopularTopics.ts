"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface PopularTopicRow {
  topic: string;
  questionCount: number;
  totalUsedCount: number;
}

export function usePopularTopics({ refreshMs = 120000, limit = 100 }: { refreshMs?: number; limit?: number }) {
  const [topics, setTopics] = useState<PopularTopicRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOnce = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/topics/popular?limit=${encodeURIComponent(String(limit))}`);
      if (!res.ok) throw new Error(`Failed with ${res.status}`);
      const data = await res.json();
      if (data?.success && Array.isArray(data.topics)) {
        setTopics(data.topics as PopularTopicRow[]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchOnce();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(fetchOnce, refreshMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [refreshMs, fetchOnce]);

  return { topics, isLoading, error, refetch: fetchOnce };
}

