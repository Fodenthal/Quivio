"use client";

import { ChatMessage as ChatMessageType } from "@shared/index";
import { ChatWindow } from "./ChatWindow";
import { ChatInput } from "./ChatInput";
import { useAuth } from "../../hooks/useAuth";

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
  const { canChat, isAuthenticated, loading } = useAuth();
  
  // Determine if chat should be disabled due to auth requirements
  const isChatDisabled = disabled || !canChat;
  
  return (
    <div className="h-full flex flex-col">
      {/* Chat Messages - flex-1 takes remaining space with fixed height */}
      <div className="flex-1 min-h-0 overflow-hidden px-3 md:px-4 pt-3 md:pt-4">
        <ChatWindow 
          messages={messages}
          currentPlayerId={currentPlayerId}
          height="h-full"
        />
      </div>

      {/* Chat Input - fixed at bottom, spans full width edge-to-edge */}
      <div className="flex-shrink-0">
        {loading ? (
          // Loading state
          <div className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
            <div className="text-sm text-text-secondary">Loading...</div>
          </div>
        ) : !canChat ? (
          // Authentication required message
          <div className="space-y-3">
            <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-center">
              <div className="text-sm text-text-secondary mb-2">
                {!isAuthenticated 
                  ? "Sign in to chat!" 
                  : "Account verification required to chat"
                }
              </div>
            </div>
          </div>
        ) : (
          // Normal chat input for verified users
          <ChatInput
            onSendMessage={onSendMessage}
            disabled={isChatDisabled}
            placeholder={isChatDisabled ? "Chat unavailable..." : "Type here to chat"}
            shouldAutoFocus={shouldAutoFocus}
          />
        )}
      </div>
    </div>
  );
} 