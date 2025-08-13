"use client";

import { ChatMessage as ChatMessageType } from "@shared/index";
import { ChatWindow } from "./ChatWindow";
import { ChatInput } from "./ChatInput";

interface ChatProps {
  messages: ChatMessageType[];
  currentPlayerId: string;
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  shouldAutoFocus?: boolean;
}

/**
 * Complete chat interface combining message display and input
 * Includes header, scrollable messages, and input controls
 * Fixed height ensures consistent sizing regardless of the content
 */
export function Chat({ 
  messages, 
  currentPlayerId, 
  onSendMessage, 
  disabled = false,
  shouldAutoFocus = false
}: ChatProps) {
  // Filter valid messages for accurate counting
  const validMessages = messages.filter((message) => message && message.id && message.playerName && message.content);
  
  return (
    <div className="min-h-[50dvh] md:h-[600px] flex flex-col safe-bottom">
      {/* Chat Header */}
      <div className="flex-shrink-0 flex items-center justify-between pb-4 border-b border-white/20">
        <h3 className="text-xl font-bold text-text-main">Chat</h3>
        <div className="text-sm text-text-secondary">
          {validMessages.length > 0 ? `${validMessages.length} messages` : "No messages"}
        </div>
      </div>

      {/* Chat Messages - flex-1 takes remaining space with fixed height */}
      <div className="flex-1 py-4 min-h-0">
        <ChatWindow 
          messages={messages}
          currentPlayerId={currentPlayerId}
          height="h-full"
        />
      </div>

      {/* Chat Input - fixed at bottom */}
      <div className="flex-shrink-0 pt-4 border-t border-white/20">
        <ChatInput
          onSendMessage={onSendMessage}
          disabled={disabled}
          placeholder={disabled ? "Chat unavailable..." : "Type a message..."}
          shouldAutoFocus={shouldAutoFocus}
        />
      </div>
    </div>
  );
} 