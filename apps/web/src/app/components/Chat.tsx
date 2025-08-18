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
  // (header removed) keep structure minimal for mobile
  
  return (
    <div className="min-h-[50dvh] md:h-[600px] flex flex-col safe-bottom">

      {/* Chat Messages - flex-1 takes remaining space with fixed height */}
      <div className="flex-1 py-4 min-h-0">
        <ChatWindow 
          messages={messages}
          currentPlayerId={currentPlayerId}
          height="h-full"
        />
      </div>

      {/* Chat Input - fixed at bottom */}
      <div className="flex-shrink-0 pt-2">
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