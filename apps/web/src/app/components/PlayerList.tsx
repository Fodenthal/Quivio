"use client";

import { PlayerData, GameState } from "@shared/index";

interface PlayerListProps {
  gameState: GameState;
  currentPlayerId: string;
}

/**
 * PlayerList component displays all players in JKLM-style boxes ordered by score.
 * This will be the foundation for showing real-time guess display and highlighting effects.
 * 
 * @param gameState - The current game state containing all player information
 * @param currentPlayerId - The session ID of the current player for highlighting
 * @returns React component displaying the player list with scores
 */
export function PlayerList({ gameState, currentPlayerId }: PlayerListProps) {
  /**
   * Converts the players Map to a sorted array ordered by score (high to low).
   * This ensures the leaderboard shows highest scoring players at the top.
   * 
   * @returns Array of PlayerData sorted by score descending
   */
  const getPlayersByScore = (): PlayerData[] => {
    return Array.from(gameState.players.values())
      .filter(player => player && player.id) // Filter out any invalid players
      .sort((a, b) => {
        // Primary sort: by score (high to low)
        if (a.score !== b.score) {
          return b.score - a.score;
        }
        // Secondary sort: by join time (earlier first) for tie-breaking
        return a.joinedAt - b.joinedAt;
      });
  };

  /**
   * Generates a placeholder avatar for a player based on their name.
   * Uses the first letter of their name with a colored background.
   * 
   * @param player - The player data object
   * @returns JSX element containing the avatar
   */
  const getPlayerAvatar = (player: PlayerData) => {
    const firstLetter = player.name.charAt(0).toUpperCase();
    // Generate a consistent color based on the player's name
    const colors = [
      "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
      "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500"
    ];
    const colorIndex = player.name.length % colors.length;
    const bgColor = colors[colorIndex];

    return (
      <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center text-white font-semibold text-lg`}>
        {firstLetter}
      </div>
    );
  };

  /**
   * Determines if a player is the current player for special styling.
   * 
   * @param player - The player data object to check
   * @returns Boolean indicating if this is the current player
   */
  const isCurrentPlayer = (player: PlayerData): boolean => {
    return player.id === currentPlayerId;
  };

  const players = getPlayersByScore();

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-gray-800 mb-4">
        Players ({players.length}/{gameState.maxPlayers})
      </h3>
      
      <div className="space-y-2">
        {players.map((player, index) => {
          const isCurrentUser = isCurrentPlayer(player);
          const isLeader = index === 0 && player.score > 0; // First player with points is leader
          
          return (
            <div
              key={`${player.id}-${player.name}-${index}`}
              className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                isCurrentUser
                  ? "bg-blue-50 border-blue-300 shadow-md"
                  : "bg-white border-gray-200 hover:border-gray-300"
              } ${
                isLeader ? "ring-2 ring-yellow-400 ring-opacity-50" : ""
              }`}
            >
              {/* Leader Crown */}
              {isLeader && (
                <div className="absolute -top-2 -right-2 text-xl">
                  👑
                </div>
              )}
              
              <div className="flex items-center justify-between">
                {/* Left side: Avatar and player info */}
                <div className="flex items-center space-x-3">
                  {getPlayerAvatar(player)}
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`font-semibold ${
                        isCurrentUser ? "text-blue-900" : "text-gray-900"
                      }`}>
                        {player.name}
                      </span>
                      
                      {/* Special badges */}
                      {player.isHost && (
                        <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">
                          Host
                        </span>
                      )}
                      {isCurrentUser && (
                        <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    
                    {/* Placeholder for future guess display */}
                    <div className="mt-1 min-h-[20px]">
                      {/* This space will be used for displaying incorrect guesses in future iterations */}
                      <span className="text-sm text-gray-400 italic">
                        {/* Placeholder - will show last incorrect guess here */}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Right side: Score */}
                <div className="text-right">
                  <div className={`text-2xl font-bold ${
                    isCurrentUser ? "text-blue-900" : "text-gray-900"
                  }`}>
                    {player.score}
                  </div>
                  <div className="text-sm text-gray-500">
                    points
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 