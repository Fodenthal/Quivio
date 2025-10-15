"use client";

import { createContext, useContext, useMemo, useState } from "react";

interface FooterVisibilityContextValue {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
}

const FooterVisibilityContext = createContext<FooterVisibilityContextValue | null>(null);

export function FooterVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(true);
  const value = useMemo(
    () => ({
      isVisible,
      setIsVisible,
    }),
    [isVisible]
  );

  return <FooterVisibilityContext.Provider value={value}>{children}</FooterVisibilityContext.Provider>;
}

export function useFooterVisibility() {
  const context = useContext(FooterVisibilityContext);
  if (!context) {
    throw new Error("useFooterVisibility must be used within a FooterVisibilityProvider");
  }
  return context;
}
