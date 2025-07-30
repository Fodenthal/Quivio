"use client";
import React, { useState, useRef } from "react";
import { useDisplayName } from "../../contexts/DisplayNameContext";

/**
 * Global user display name component for Quivio
 * Always shows a text box, updates dynamically as user types (debounced and on blur).
 * Uses DisplayNameContext for global state management.
 */
export const UserDisplayName: React.FC = () => {
  const { displayName, setDisplayName } = useDisplayName();
  const [input, setInput] = useState<string>(displayName);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Sync input with displayName when it changes from context
  React.useEffect(() => {
    setInput(displayName);
  }, [displayName]);

  // Debounced update
  const handleInputChange = (val: string) => {
    setInput(val);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      commitName(val);
    }, 500);
  };

  const commitName = (val: string) => {
    setDisplayName(val);
  };

  const handleBlur = () => {
    commitName(input);
  };

  return (
    <div className="flex items-center">
      <div className="flex items-center bg-light-background-elevated dark:bg-dark-background-elevated border border-light-border-primary dark:border-dark-border-primary shadow-light dark:shadow-cursor rounded-full px-4 py-2 gap-3 hover:border-light-border-hover dark:hover:border-dark-border-hover transition-all duration-200">
        <span className="text-light-accent-primary dark:text-dark-accent-primary">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </span>
        <input
          id="display-name-input"
          type="text"
          value={input}
          onChange={e => handleInputChange(e.target.value)}
          onBlur={handleBlur}
          maxLength={16}
          placeholder="Display name"
          className="bg-transparent border-none outline-none font-medium text-light-text-primary dark:text-dark-text-primary text-sm w-32 focus:ring-0 px-0 placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary"
          style={{ minWidth: 80 }}
        />
      </div>
    </div>
  );
}; 