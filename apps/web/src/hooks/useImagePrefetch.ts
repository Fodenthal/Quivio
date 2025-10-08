"use client";

import { useEffect, useRef, useState } from "react";

type PrefetchStatus = "idle" | "loading" | "loaded" | "error";

/**
 * Prefetch an image URL and expose status so callers can react.
 * Caches successful URLs to avoid redundant network work.
 */
export function useImagePrefetch(url: string | null | undefined): PrefetchStatus {
  const [status, setStatus] = useState<PrefetchStatus>("idle");
  const prefetchedUrlsRef = useRef<Set<string>>(new Set());
  const activeUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!url || typeof url !== "string" || !url.trim()) {
      activeUrlRef.current = null;
      setStatus("idle");
      return;
    }

    const trimmedUrl = url.trim();

    if (prefetchedUrlsRef.current.has(trimmedUrl)) {
      activeUrlRef.current = trimmedUrl;
      setStatus("loaded");
      return;
    }

    activeUrlRef.current = trimmedUrl;
    setStatus("loading");

    if (typeof window === "undefined") {
      return () => {
        activeUrlRef.current = null;
      };
    }

    let cancelled = false;
    const img = new Image();
    img.decoding = "async";
    img.loading = "eager";
    img.src = trimmedUrl;

    img.onload = () => {
      if (cancelled || activeUrlRef.current !== trimmedUrl) return;
      prefetchedUrlsRef.current.add(trimmedUrl);
      setStatus("loaded");
    };

    img.onerror = () => {
      if (cancelled || activeUrlRef.current !== trimmedUrl) return;
      setStatus("error");
    };

    return () => {
      cancelled = true;
    };
  }, [url]);

  return status;
}
