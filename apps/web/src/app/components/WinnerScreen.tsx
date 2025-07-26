"use client";

import { PlayerData } from "@shared/index";

interface WinnerScreenProps {
  winner: PlayerData;
  restartCountdown: number;
}

export function WinnerScreen({ 
  winner, 
  restartCountdown
}: WinnerScreenProps) {

  const getWinnerAvatar = (player: PlayerData) => {
    const firstLetter = player.name.charAt(0).toUpperCase();
    // Expanded color palette to match PlayerList and Chat
    const colors = [
      "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
      "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500",
      "bg-orange-500", "bg-cyan-500", "bg-lime-500", "bg-emerald-500",
      "bg-violet-500", "bg-rose-500", "bg-amber-500", "bg-sky-500"
    ];
    const colorIndex = player.name.length % colors.length;
    const bgColor = colors[colorIndex];

    return (
      <div className="relative">
        <div className={`w-32 h-32 rounded-lg ${bgColor} flex items-center justify-center text-white font-bold text-5xl shadow-2xl border-4 border-white`}>
          {firstLetter}
        </div>
        <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg border-2 border-white">
          <span className="text-3xl">🏆</span>
        </div>
      </div>
    );
  };



  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-8 space-y-8">
      <div className="relative z-10 w-full max-w-md space-y-8 px-6 py-8 bg-white/10 rounded-2xl shadow-glass border border-white/20 text-center">
        
        <div className="space-y-4">
          <div className="flex justify-center">
            {getWinnerAvatar(winner)}
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-bold text-primary tracking-wide">
              {winner.name}
            </h1>
            <h2 className="text-3xl font-medium text-text-main">
              won the game!
            </h2>
          </div>
          <div className="bg-black/20 border border-white/20 rounded-xl px-4 py-3 shadow-inner">
            <div className="text-text-secondary text-sm font-medium mb-1">Final Score</div>
            <div className="text-2xl font-bold text-green-400">
              {winner.score} points
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-4xl font-bold text-text-main mb-1">
            {restartCountdown}
          </div>
          <div className="text-sm text-text-secondary">
            seconds until returning to lobby
          </div>
        </div>
      </div>
    </div>
  );
}