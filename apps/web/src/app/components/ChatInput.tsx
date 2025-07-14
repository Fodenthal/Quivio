"use client";

import { useState, KeyboardEvent } from "react";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

/**
 * Chat input component with send button and keyboard support
 * Includes character limits and disabled state handling
 */
export function ChatInput({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Type a message...",
  maxLength = 200 
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSubmitting || disabled) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSendMessage(trimmedMessage);
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = message.trim().length > 0 && !isSubmitting && !disabled;
  const remainingChars = maxLength - message.length;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isSubmitting}
          maxLength={maxLength}
          className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        />
        <button
          onClick={handleSubmit}
          disabled={!canSend}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-medium"
        >
          {isSubmitting ? "..." : "Send"}
        </button>
      </div>
      
      {message.length > maxLength * 0.8 && (
        <div className="text-right">
          <span className={`text-xs ${
            remainingChars < 20 ? "text-red-400" : "text-text-secondary"
          }`}>
            {remainingChars} characters remaining
          </span>
        </div>
      )}
    </div>
  );
} 