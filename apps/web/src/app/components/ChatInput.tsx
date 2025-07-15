"use client";

import { useState, KeyboardEvent, useRef} from "react";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

/**
 * Chat input component with multi-line support and keyboard submission
 * Includes character limits, auto-resize, and disabled state handling
 */
export function ChatInput({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Type a message...",
  maxLength = 200 
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const remainingChars = maxLength - message.length;

  return (
    <div className="space-y-2">
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isSubmitting}
        maxLength={maxLength}
        rows={2}
        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 resize-none overflow-y-auto"
      />
      
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