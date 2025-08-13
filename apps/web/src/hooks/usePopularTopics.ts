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
  const cacheKey = `popularTopics:${limit}`;

  const fetchOnce = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/topics/popular?limit=${encodeURIComponent(String(limit))}`);
      if (!res.ok) throw new Error(`Failed with ${res.status}`);
      const data = await res.json();
      if (data?.success && Array.isArray(data.topics)) {
        const next = data.topics as PopularTopicRow[];
        setTopics(next);
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), topics: next }));
        } catch {}
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [limit, cacheKey]);

  useEffect(() => {
    // Prime from session cache if fresh
    try {
      const raw = sessionStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { ts: number; topics: PopularTopicRow[] };
        if (parsed && Array.isArray(parsed.topics) && typeof parsed.ts === 'number') {
          const isFresh = Date.now() - parsed.ts < refreshMs;
          if (isFresh) {
            setTopics(parsed.topics);
          }
        }
      }
    } catch {}

    fetchOnce();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(fetchOnce, refreshMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [refreshMs, fetchOnce, cacheKey]);

  return { topics, isLoading, error, refetch: fetchOnce };
}

