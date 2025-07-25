"use client";

import { useState } from "react";

interface GamePinsProps {
  gamePin: string;
  className?: string;
}

/**
 * GamePins component for displaying and sharing room game pins
 * Features prominent display and copy-to-clipboard functionality
 */
export function GamePins({ gamePin, className = "" }: GamePinsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyPin = async () => {
    try {
      await navigator.clipboard.writeText(gamePin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy game pin:", error);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = gamePin;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        console.error("Fallback copy failed:", fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  if (!gamePin) {
    return null;
  }

  return (
    <div className={`bg-black/20 p-2 rounded-md border border-white/20 ${className}`}>
      <div className="flex items-center space-x-2">
        <span className="text-lg font-mono text-text-main tracking-wider">
          {gamePin}
        </span>
        
        <button
          onClick={handleCopyPin}
          className="p-1.5 rounded-md hover:bg-white/20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Copy game pin"
        >
          {copied ? (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-green-400" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
          ) : (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-text-secondary" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2H6zm8 2H6v11h8V5z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
} 