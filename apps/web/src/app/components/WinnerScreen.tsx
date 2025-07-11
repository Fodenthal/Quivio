"use client";

import { PlayerData } from "@shared/index";

interface WinnerScreenProps {
  winner: PlayerData;
}

/**
 * WinnerScreen component displays a celebration overlay within the game container when a player wins.
 * Fits within the same container as the game view for a more integrated experience.
 * 
 * @param winner - The player data object for the game winner
 * @returns React component displaying the winner celebration screen
 */
export function WinnerScreen({ winner }: WinnerScreenProps) {
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

  return (
    // Container overlay that fits within the game view
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 rounded-lg">
      {/* Semi-transparent overlay for depth */}
      <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg" />
      
      {/* Main content container - more compact for contained view */}
      <div className="relative z-10 text-center space-y-4 px-6 py-4">
        {/* Winner's avatar with gold medal */}
        <div className="flex justify-center">
          {getWinnerAvatar(winner)}
        </div>
        
        {/* Winner's name in large white text - smaller for contained view */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white drop-shadow-2xl tracking-wide">
            {winner.name}
          </h1>
          
          {/* "won the game!" message matching JKLM format */}
          <h2 className="text-xl font-medium text-purple-100 drop-shadow-lg">
            won the game!
          </h2>
        </div>
        
        {/* Winner's final score - more compact */}
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl px-6 py-4 border border-white border-opacity-30">
          <div className="text-white text-sm font-medium mb-1">Final Score</div>
          <div className="text-2xl font-bold text-yellow-300 drop-shadow-lg">
            {winner.score} points
          </div>
        </div>
        
        {/* Decorative elements for celebration - smaller for contained view */}
        <div className="flex justify-center space-x-3 text-2xl animate-bounce">
          <span className="animation-delay-0">🎉</span>
          <span className="animation-delay-75">✨</span>
          <span className="animation-delay-150">🎊</span>
          <span className="animation-delay-225">✨</span>
          <span className="animation-delay-300">🎉</span>
        </div>
      </div>
      
      {/* Floating particles effect - positioned for contained view */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
        {/* Top-left sparkles */}
        <div className="absolute top-4 left-4 text-yellow-300 text-lg animate-pulse">✨</div>
        <div className="absolute top-8 left-12 text-yellow-200 text-base animate-bounce">⭐</div>
        
        {/* Top-right sparkles */}
        <div className="absolute top-6 right-8 text-yellow-300 text-base animate-pulse animation-delay-150">✨</div>
        <div className="absolute top-12 right-4 text-yellow-200 text-lg animate-bounce animation-delay-300">⭐</div>
        
        {/* Bottom sparkles */}
        <div className="absolute bottom-8 left-8 text-yellow-300 text-base animate-pulse animation-delay-450">✨</div>
      </div>
    </div>
  );
} 