"use client";

import { ChatMessage as ChatMessageType } from "@shared/index";

interface ChatMessageProps {
  message: ChatMessageType;
  isCurrentPlayer?: boolean;
}

/**
 * Individual chat message component with player avatar and styling
 * Supports both player messages and system messages
 */
export function ChatMessage({ message, isCurrentPlayer = false }: ChatMessageProps) {
  // Early return if message is invalid
  if (!message || !message.playerName || !message.content) {
    return null;
  }

  const getPlayerAvatar = (playerName: string) => {
    if (!playerName || typeof playerName !== 'string') {
      return (
        <div className="w-7 h-7 rounded-lg bg-gray-500 flex items-center justify-center text-white font-bold text-xs shadow-lg flex-shrink-0">
          ?
        </div>
      );
    }

    const firstLetter = playerName.charAt(0).toUpperCase();
    // Expanded color palette to match PlayerList
    const colors = [
      "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
      "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500",
      "bg-orange-500", "bg-cyan-500", "bg-lime-500", "bg-emerald-500",
      "bg-violet-500", "bg-rose-500", "bg-amber-500", "bg-sky-500"
    ];
    const colorIndex = playerName.length % colors.length;
    const bgColor = colors[colorIndex];

    return (
      <div className={`w-7 h-7 rounded-lg ${bgColor} flex items-center justify-center text-white font-bold text-xs shadow-lg flex-shrink-0`}>
        {firstLetter}
      </div>
    );
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (message.type === "system") {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-accent/20 text-accent px-3 py-1 rounded-full text-xs font-medium">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start space-x-2 py-1.5 pr-3 pl-0.5 rounded-lg transition-colors ${
      isCurrentPlayer ? "" : "hover:bg-white/5"
    }`}>
      {getPlayerAvatar(message.playerName)}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline space-x-2">
          <span className={`font-semibold text-sm ${
            isCurrentPlayer ? "text-primary" : "text-text-main"
          }`}>
            {message.playerName}
          </span>
          <span className="text-xs text-text-secondary">
            {formatTime(message.timestamp)}
          </span>
        </div>
        <p className="text-sm text-text-main mt-1 break-words">
          {message.content}
        </p>
      </div>
    </div>
  );
} 