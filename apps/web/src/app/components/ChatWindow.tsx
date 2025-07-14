"use client";

import { useEffect, useRef } from "react";
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

  const scrollToBottom = () => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check if user is near bottom to decide whether to auto-scroll
  const isNearBottom = () => {
    if (!containerRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    return scrollTop + clientHeight >= scrollHeight - 50; // 50px threshold
  };

  // Only auto-scroll if user is near the bottom
  useEffect(() => {
    if (isNearBottom()) {
      scrollToBottom();
    }
  }, [messages]);

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