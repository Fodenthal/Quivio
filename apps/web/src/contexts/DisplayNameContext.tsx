"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

const generateRandomPlayerName = (): string => {
  const num = Math.floor(1000 + Math.random() * 9000); // 4-digit number
  return `Player${num}`;
};

interface DisplayNameContextType {
  displayName: string;
  setDisplayName: (name: string) => void;
}

const DisplayNameContext = createContext<DisplayNameContextType | undefined>(undefined);

interface DisplayNameProviderProps {
  children: ReactNode;
}

export const DisplayNameProvider: React.FC<DisplayNameProviderProps> = ({ children }) => {
  const [displayName, setDisplayNameState] = useState<string>("Guest");

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("quivioDisplayName");
    if (stored && stored.trim()) {
      setDisplayNameState(stored);
    } else {
      // Generate and set a random Player name
      const randomName = generateRandomPlayerName();
      setDisplayNameState(randomName);
      localStorage.setItem("quivioDisplayName", randomName);
    }
  }, []);

  // Save to localStorage when name changes (except 'Guest')
  useEffect(() => {
    if (displayName && displayName !== "Guest") {
      localStorage.setItem("quivioDisplayName", displayName);
    } else {
      localStorage.removeItem("quivioDisplayName");
    }
  }, [displayName]);

  const setDisplayName = (name: string) => {
    const trimmed = name.trim().slice(0, 16);
    setDisplayNameState(trimmed || "Guest");
  };

  return (
    <DisplayNameContext.Provider value={{ displayName, setDisplayName }}>
      {children}
    </DisplayNameContext.Provider>
  );
};

export const useDisplayName = (): DisplayNameContextType => {
  const context = useContext(DisplayNameContext);
  if (context === undefined) {
    throw new Error("useDisplayName must be used within a DisplayNameProvider");
  }
  return context;
}; 