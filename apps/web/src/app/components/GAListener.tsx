"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export type GAListenerProps = {
  measurementId: string;
};

/**
 * Listens for client-side route changes and emits GA4 page_view events.
 *
 * @param measurementId - GA4 Measurement ID
 */
export const GAListener = ({ measurementId }: GAListenerProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!measurementId || typeof window === "undefined") {
      return;
    }

    const pagePath = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gtag = (window as any).gtag as undefined | ((...args: unknown[]) => void);
    if (typeof gtag === "function") {
      gtag("config", measurementId, { page_path: pagePath });
    }
  }, [measurementId, pathname, searchParams]);

  return null;
};

