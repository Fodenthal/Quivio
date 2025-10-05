"use client";

import { ChatMessage as ChatMessageType, PlayerData } from "@shared/index";

interface ChatMessageProps {
  message: ChatMessageType;
  isCurrentPlayer?: boolean;
  players: Map<string, PlayerData>;
}

/**
 * Individual chat message component with player avatar and styling
 * Supports both player messages and system messages
 */
export function ChatMessage({ message, isCurrentPlayer = false, players }: ChatMessageProps) {
  // Early return if message is invalid
  if (!message || !message.playerName || !message.content) {
    return null;
  }

  const getPlayerAvatar = (playerName: string, playerId: string) => {
    if (!playerName || typeof playerName !== 'string') {
      return (
        <div className="w-7 h-7 rounded-lg bg-gray-500 flex items-center justify-center text-white font-bold text-xs shadow-lg flex-shrink-0">
          ?
        </div>
      );
    }

    const firstLetter = playerName.charAt(0).toUpperCase();
    
    // Get player's avatar hue from players map (same system as PlayerList)
    const player = players.get(playerId);
    const hue = player?.avatarHue ?? 220; // Default to blue if not set
    const backgroundColor = `hsl(${hue}, 65%, 55%)`; // Vibrant but not too bright
    const shadowColor = `hsl(${hue} 65% 35% / 0.25)`; // Darker shade for shadow

    return (
      <div 
        className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-lg flex-shrink-0"
        style={{ 
          backgroundColor,
          boxShadow: `0 4px 12px ${shadowColor}`
        }}
      >
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
      {getPlayerAvatar(message.playerName, message.playerId)}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline space-x-2">
          <span className={`font-semibold text-sm ${
            isCurrentPlayer ? "text-primary" : "text-indigo-300"
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