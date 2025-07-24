"use client";
import React, { useState, useEffect, useRef } from "react";

/**
 * Global user display name component for Quivio
 * Always shows a text box, updates dynamically as user types (debounced and on blur).
 * Defaults to 'Guest' if no name is set.
 */
export const UserDisplayName: React.FC = () => {
  const [name, setName] = useState<string>("Guest");
  const [input, setInput] = useState<string>("");
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("quivioDisplayName");
    if (stored && stored.trim()) {
      setName(stored);
      setInput(stored);
    } else {
      setName("Guest");
      setInput("");
    }
  }, []);

  // Save to localStorage when name changes (except 'Guest')
  useEffect(() => {
    if (name && name !== "Guest") {
      localStorage.setItem("quivioDisplayName", name);
    } else {
      localStorage.removeItem("quivioDisplayName");
    }
  }, [name]);

  // Debounced update
  const handleInputChange = (val: string) => {
    setInput(val);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      commitName(val);
    }, 500);
  };

  const commitName = (val: string) => {
    const trimmed = val.trim().slice(0, 16);
    setName(trimmed || "Guest");
  };

  const handleBlur = () => {
    commitName(input);
  };

  return (
    <div className="flex items-center">
      <div className="flex items-center bg-white/80 border border-primary/30 shadow-md rounded-full px-4 py-2 space-x-2">
        <span className="text-primary text-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </span>
        <input
          id="display-name-input"
          type="text"
          value={input}
          onChange={e => handleInputChange(e.target.value)}
          onBlur={handleBlur}
          maxLength={16}
          placeholder="Display name"
          className="bg-transparent border-none outline-none font-semibold text-black text-base w-32 focus:ring-0 px-0"
          style={{ minWidth: 80 }}
        />
      </div>
    </div>
  );
}; 