"use client";

import { PlayerData } from "@shared/index";

interface WinnerScreenProps {
  winner: PlayerData;
}

/**
 * WinnerScreen component displays a full-screen celebration overlay when a player wins the game.
 * Inspired by JKLM's sleek design with gradient backgrounds and prominent winner display.
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
        {/* Main avatar circle - larger size for winner display */}
        <div className={`w-32 h-32 rounded-full ${bgColor} flex items-center justify-center text-white font-bold text-4xl shadow-2xl border-4 border-white`}>
          {firstLetter}
        </div>
        
        {/* Gold medal overlay */}
        <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
          <span className="text-2xl">🏆</span>
        </div>
      </div>
    );
  };

  return (
    // Full-screen overlay with JKLM-style gradient background
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      {/* Semi-transparent overlay for depth */}
      <div className="absolute inset-0 bg-black bg-opacity-20" />
      
      {/* Main content container */}
      <div className="relative z-10 text-center space-y-8 px-8">
        {/* Winner's avatar with gold medal */}
        <div className="flex justify-center">
          {getWinnerAvatar(winner)}
        </div>
        
        {/* Winner's name in large white text */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-white drop-shadow-2xl tracking-wide">
            {winner.name}
          </h1>
          
          {/* "won the game!" message matching JKLM format */}
          <h2 className="text-3xl font-medium text-purple-100 drop-shadow-lg">
            won the game!
          </h2>
        </div>
        
        {/* Winner's final score */}
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl px-8 py-6 border border-white border-opacity-30">
          <div className="text-white text-xl font-medium mb-2">Final Score</div>
          <div className="text-4xl font-bold text-yellow-300 drop-shadow-lg">
            {winner.score} points
          </div>
        </div>
        
        {/* Decorative elements for celebration */}
        <div className="flex justify-center space-x-4 text-4xl animate-bounce">
          <span className="animation-delay-0">🎉</span>
          <span className="animation-delay-75">✨</span>
          <span className="animation-delay-150">🎊</span>
          <span className="animation-delay-225">✨</span>
          <span className="animation-delay-300">🎉</span>
        </div>
      </div>
      
      {/* Floating particles effect (optional decorative enhancement) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top-left sparkles */}
        <div className="absolute top-20 left-20 text-yellow-300 text-2xl animate-pulse">✨</div>
        <div className="absolute top-32 left-40 text-yellow-200 text-xl animate-bounce">⭐</div>
        
        {/* Top-right sparkles */}
        <div className="absolute top-24 right-32 text-yellow-300 text-xl animate-pulse animation-delay-150">✨</div>
        <div className="absolute top-40 right-20 text-yellow-200 text-2xl animate-bounce animation-delay-300">⭐</div>
        
        {/* Bottom sparkles */}
        <div className="absolute bottom-32 left-32 text-yellow-300 text-xl animate-pulse animation-delay-450">✨</div>
      </div>
    </div>
  );
} 