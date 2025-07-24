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
    <div className="flex flex-col items-end space-y-1">
      <label htmlFor="display-name-input" className="text-xs font-medium text-gray-600 pr-1">Display name</label>
      <input
        id="display-name-input"
        type="text"
        value={input}
        onChange={e => handleInputChange(e.target.value)}
        onBlur={handleBlur}
        maxLength={16}
        placeholder="Display name"
        className="px-2 py-1 rounded border border-primary focus:outline-none focus:ring-2 focus:ring-primary font-medium bg-white/80 text-black"
        style={{ minWidth: 100 }}
      />
    </div>
  );
}; 