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
    <div className={`bg-primary/20 border border-primary/30 rounded-lg p-4 ${className}`}>
      <div className="text-center">
        <h3 className="text-sm font-medium text-text-secondary mb-2">Room Code</h3>
        <div className="flex items-center justify-center space-x-3">
          <div className="text-2xl font-bold text-primary font-mono tracking-widest">
            {gamePin}
          </div>
          <button
            onClick={handleCopyPin}
            className="px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-md hover:bg-opacity-90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            {copied ? "✓ Copied!" : "📋 Copy"}
          </button>
        </div>
        <p className="text-xs text-text-secondary mt-2">
          Share this code with friends to let them join your room
        </p>
      </div>
    </div>
  );
} 