"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessage as ChatMessageType } from "@shared/index";
import { ChatMessage } from "./ChatMessage";

interface ChatWindowProps {
  messages: ChatMessageType[];
  currentPlayerId: string;
  height?: string;
}

/**
 * Scrollable chat window component with auto-scroll to bottom
 * Shows list of chat messages with proper avatar and styling
 */
export function ChatWindow({ 
  messages, 
  currentPlayerId, 
  height = "h-96" 
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const scrollToBottom = () => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Check if user is near bottom to decide whether to auto-scroll
  const isNearBottom = () => {
    if (!containerRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    return scrollTop + clientHeight >= scrollHeight - 50; // 50px threshold
  };

  // Handle manual scrolling - disable auto-scroll if user scrolls up
  const handleScroll = () => {
    if (containerRef.current) {
      const isAtBottom = isNearBottom();
      setShouldAutoScroll(isAtBottom);
    }
  };

  // Auto-scroll when new messages arrive (if user is at bottom or should auto-scroll)
  useEffect(() => {
    const validMessages = messages.filter((message) => message && message.id && message.playerName);
    const currentMessageCount = validMessages.length;
    
    // Only auto-scroll if we have new messages and either:
    // 1. User is still set to auto-scroll (hasn't manually scrolled up)
    // 2. User is currently near the bottom
    if (currentMessageCount > previousMessageCount) {
      if (shouldAutoScroll || isNearBottom()) {
        scrollToBottom();
        setShouldAutoScroll(true); // Re-enable auto-scroll when new messages arrive and we scroll
      }
    }
    
    setPreviousMessageCount(currentMessageCount);
  }, [messages]); // Remove previousMessageCount from dependencies to avoid extra re-runs

  // Initial scroll to bottom when component mounts
  useEffect(() => {
    scrollToBottom();
  }, []);

  if (messages.length === 0) {
    return (
      <div className={`${height} bg-black/20 rounded-lg p-4 flex items-center justify-center`}>
        <div className="text-center text-text-secondary">
          <p className="text-sm">No messages yet</p>
          <p className="text-xs mt-1">Start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className={`${height} bg-black/20 rounded-lg overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent`}
    >
      <div className="p-2 space-y-1">
        {messages
          .filter((message) => message && message.id && message.playerName)
          .map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isCurrentPlayer={message.playerId === currentPlayerId}
            />
          ))}
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
} 