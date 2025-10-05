"use client";

import { useState, KeyboardEvent, useRef, useEffect, forwardRef, useImperativeHandle } from "react";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  shouldAutoFocus?: boolean;
}

export interface ChatInputRef {
  focus: () => void;
  blur: () => void;
}

/**
 * Chat input component with multi-line support and keyboard submission
 * Includes character limits, auto-resize, and disabled state handling
 * Supports auto-focus when chat area is clicked
 */
export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(function ChatInput({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Type a message...",
  maxLength = 200,
  shouldAutoFocus = false
}, ref) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    },
    blur: () => {
      if (textareaRef.current) {
        textareaRef.current.blur();
      }
    }
  }));

  // Auto-focus when shouldAutoFocus changes to true
  useEffect(() => {
    if (shouldAutoFocus && textareaRef.current) {
      const timer = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoFocus]);

  const handleSubmit = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSubmitting || disabled) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSendMessage(trimmedMessage);
      setMessage("");
      // Keep focus on textarea after sending message
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 50);
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
    <>
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          try {
            const y = window.scrollY;
            setTimeout(() => window.scrollTo({ top: y }), 0);
          } catch {}
        }}
        placeholder={placeholder}
        disabled={disabled || isSubmitting}
        maxLength={maxLength}
        rows={2}
        className="w-full px-3 py-2 bg-black/30 text-[13px] text-text-main placeholder-text-secondary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 resize-none overflow-y-auto block"
      />
      
      {message.length > maxLength * 0.8 && (
        <div className="text-right px-3 py-1 bg-black/30">
          <span className={`text-xs ${
            remainingChars < 20 ? "text-red-400" : "text-text-secondary"
          }`}>
            {remainingChars} characters remaining
          </span>
        </div>
      )}
    </>
  );
}); 