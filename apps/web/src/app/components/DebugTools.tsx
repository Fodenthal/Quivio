"use client";

import { useEffect } from "react";

/**
 * DebugTools component - loads debug utilities in development mode
 * This makes debugGameStorage available in the browser console
 */
export function DebugTools() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      // Dynamically import debug tools and make them globally available
      import("../../utils/debugStorage").then(({ debugGameStorage }) => {
        (window as typeof window & { debugGameStorage: typeof debugGameStorage }).debugGameStorage = debugGameStorage;
        console.log("🔧 Debug tools loaded! Try: debugGameStorage.logAllData()");
      }).catch((error) => {
        console.warn("Failed to load debug tools:", error);
      });
    }
  }, []);

  // This component renders nothing
  return null;
}
