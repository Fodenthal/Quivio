"use client";

import { ChatMessage as ChatMessageType } from "@shared/index";
import { ChatWindow } from "./ChatWindow";
import { ChatInput } from "./ChatInput";

interface ChatProps {
  messages: ChatMessageType[];
  currentPlayerId: string;
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

/**
 * Complete chat interface combining message display and input
 * Includes header, scrollable messages, and input controls
 */
export function Chat({ 
  messages, 
  currentPlayerId, 
  onSendMessage, 
  disabled = false 
}: ChatProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/20">
        <h3 className="text-xl font-bold text-text-main">Chat</h3>
        <div className="text-sm text-text-secondary">
          {messages.length > 0 ? `${messages.length} messages` : "No messages"}
        </div>
      </div>

      {/* Chat Messages - flex-1 takes remaining space */}
      <div className="flex-1 py-4">
        <ChatWindow 
          messages={messages}
          currentPlayerId={currentPlayerId}
          height="h-full"
        />
      </div>

      {/* Chat Input - fixed at bottom */}
      <div className="pt-4 border-t border-white/20">
        <ChatInput
          onSendMessage={onSendMessage}
          disabled={disabled}
          placeholder={disabled ? "Chat unavailable..." : "Type a message..."}
        />
      </div>
    </div>
  );
} 