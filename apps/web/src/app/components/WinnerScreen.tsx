"use client";

import { PlayerData } from "@shared/index";

interface WinnerScreenProps {
  winner: PlayerData;
  restartCountdown: number;
  participatingPlayers: Map<string, boolean>;
  allPlayers: Map<string, PlayerData>;
  currentPlayerId: string;
  onJoinNextGame: () => void;
}

/**
 * WinnerScreen component displays a celebration overlay within the game container when a player wins.
 * Includes JKLM-style auto-restart system with countdown and "Join Game" functionality.
 * 
 * @param winner - The player data object for the game winner
 * @param restartCountdown - Seconds remaining before auto-restart
 * @param participatingPlayers - Map of players who want to play again
 * @param allPlayers - Map of all current players
 * @param currentPlayerId - The current user's player ID
 * @param onJoinNextGame - Callback to join the next game
 * @returns React component displaying the winner celebration screen with restart options
 */
export function WinnerScreen({ 
  winner, 
  restartCountdown, 
  participatingPlayers, 
  allPlayers, 
  currentPlayerId, 
  onJoinNextGame 
}: WinnerScreenProps) {
  /**
   * Generates a winner avatar with gold medal overlay, reusing the existing avatar logic
   * from PlayerList but enhanced for the winner celebration.
   * 
   * @param player - The winner player data object
   * @returns JSX element containing the winner's avatar with gold medal
   */
  const getWinnerAvatar = (player: PlayerData) => {
    const firstLetter = player.name.charAt(0).toUpperCase();
    // Generate a consistent color based on the player's name (same as PlayerList)
    const colors = [
      "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
      "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500"
    ];
    const colorIndex = player.name.length % colors.length;
    const bgColor = colors[colorIndex];

    return (
      <div className="relative">
        {/* Main avatar circle - medium size for contained display */}
        <div className={`w-20 h-20 rounded-full ${bgColor} flex items-center justify-center text-white font-bold text-2xl shadow-xl border-4 border-white`}>
          {firstLetter}
        </div>
        
        {/* Gold medal overlay */}
        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
          <span className="text-lg">🏆</span>
        </div>
      </div>
    );
  };

  // Helper to generate player avatar (simplified version of PlayerList logic)
  const getPlayerAvatar = (player: PlayerData) => {
    const firstLetter = player.name.charAt(0).toUpperCase();
    const colors = [
      "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
      "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500"
    ];
    const colorIndex = player.name.length % colors.length;
    const bgColor = colors[colorIndex];

    return (
      <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center text-white font-bold text-sm`}>
        {firstLetter}
      </div>
    );
  };

  // Check if current player has already joined
  const hasJoined = participatingPlayers.has(currentPlayerId);

  // Get participating players data
  const participatingPlayersData = Array.from(participatingPlayers.keys())
    .map(playerId => allPlayers.get(playerId))
    .filter((player): player is PlayerData => player !== undefined);

  return (
    // Container overlay that covers the entire game container including padding
    <div className="absolute -inset-6 z-50 flex items-center justify-center bg-white rounded-lg">
      {/* Semi-transparent overlay for depth */}
      <div className="absolute inset-0 bg-gray-100 bg-opacity-80 rounded-lg border-2 border-gray-200" />
      
      {/* Main content container with two sections */}
      <div className="relative z-10 w-full max-w-md space-y-6 px-6 py-4">
        
        {/* Winner celebration section */}
        <div className="text-center space-y-4">
          {/* Winner's avatar with gold medal */}
          <div className="flex justify-center">
            {getWinnerAvatar(winner)}
          </div>
          
          {/* Winner's name and message */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 tracking-wide">
              {winner.name}
            </h1>
            <h2 className="text-xl font-medium text-gray-700">
              won the game!
            </h2>
          </div>
          
          {/* Winner's final score */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
            <div className="text-gray-600 text-sm font-medium mb-1">Final Score</div>
            <div className="text-xl font-bold text-green-600">
              {winner.score} points
            </div>
          </div>
        </div>

        {/* JKLM-style restart system */}
        <div className="space-y-4">
          
          {/* Countdown timer */}
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {restartCountdown}
            </div>
            <div className="text-sm text-gray-600">
              seconds until next game starts
            </div>
          </div>

          {/* Join Game button */}
          <div className="text-center">
            <button
              onClick={onJoinNextGame}
              disabled={hasJoined}
              className={`px-8 py-3 rounded-lg font-bold text-lg transition-all ${
                hasJoined
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {hasJoined ? 'Waiting for others...' : 'Join Game'}
            </button>
          </div>

          {/* Participating players list */}
          {participatingPlayersData.length > 0 && (
            <div className="space-y-2">
              <div className="text-center text-sm font-medium text-gray-600">
                {participatingPlayersData.length} player{participatingPlayersData.length !== 1 ? 's' : ''} ready:
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {participatingPlayersData.map((player) => (
                  <div key={player.id} className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm border">
                    {getPlayerAvatar(player)}
                    <span className="text-sm font-medium text-gray-900">{player.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Floating particles effect - positioned for contained view */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
        <div className="absolute top-4 left-4 text-yellow-500 text-lg animate-pulse">✨</div>
        <div className="absolute top-8 left-12 text-yellow-600 text-base animate-bounce">⭐</div>
        <div className="absolute top-6 right-8 text-yellow-500 text-base animate-pulse">✨</div>
        <div className="absolute top-12 right-4 text-yellow-600 text-lg animate-bounce">⭐</div>
        <div className="absolute bottom-8 left-8 text-yellow-500 text-base animate-pulse">✨</div>
      </div>
    </div>
  );
} 