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
  
  // Debug logging for auth state
  console.log('Chat auth state:', { canChat, isAuthenticated, loading });
  
  // Message count for desktop header; mobile stays minimal
  const validMessages = messages.filter((m) => m && m.id && m.playerName && m.content);
  
  // Determine if chat should be disabled due to auth requirements
  const isChatDisabled = disabled || !canChat;
  
  return (
    <div className="min-h-[50dvh] md:h-[600px] flex flex-col safe-bottom">
      {/* Desktop header only */}
      <div className="hidden md:flex items-center justify-between pb-4 border-b border-white/20">
        <div className="flex items-center space-x-3">
          <h3 className="text-xl font-bold text-text-main">Chat</h3>
          {!loading && (
            <div className="flex items-center space-x-1">
              {canChat ? (
                <div className="flex items-center space-x-1 text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs">Verified</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-yellow-400">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-xs">
                    {isAuthenticated ? "Unverified" : "Guest"}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="text-sm text-text-secondary">
          {validMessages.length > 0 ? `${validMessages.length} messages` : "No messages"}
        </div>
      </div>

      {/* Chat Messages - flex-1 takes remaining space with fixed height */}
      <div className="flex-1 min-h-0 overflow-hidden md:mt-2">
        <ChatWindow 
          messages={messages}
          currentPlayerId={currentPlayerId}
          height="h-full"
        />
      </div>

      {/* Chat Input - fixed at bottom */}
      <div className="flex-shrink-0 mt-2">
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
            placeholder={isChatDisabled ? "Chat unavailable..." : "Type a message..."}
            shouldAutoFocus={shouldAutoFocus}
          />
        )}
      </div>
    </div>
  );
} 