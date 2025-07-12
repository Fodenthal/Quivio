"use client";

import { useState, useEffect } from "react";

interface GamePin {
  id: string;
  pin: string;
  status: "available" | "full";
}

export function GamePins() {
  const [gamePins, setGamePins] = useState<GamePin[]>([]);

  // Generate random 5-character game pins
  const generateGamePin = (): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  // Initialize game pins on mount
  useEffect(() => {
    const pins: GamePin[] = [];
    
    // Create 48 pins: 8 available (green) and 40 full (red)
    for (let i = 0; i < 48; i++) {
      pins.push({
        id: `pin-${i}`,
        pin: generateGamePin(),
        status: i < 8 ? "available" : "full"
      });
    }
    
    // Shuffle the array to randomly distribute green and red pins
    const shuffledPins = pins.sort(() => Math.random() - 0.5);
    setGamePins(shuffledPins);
  }, []);

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-glass p-6 border border-white/20 h-full">
      <h2 className="text-2xl font-bold text-text-main mb-4 text-center">
        Game Rooms
      </h2>
      
      <div className="h-[calc(100%-4rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        <div className="space-y-2 p-2">
          {gamePins.map((gamePin) => (
            <div
              key={gamePin.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:scale-105 cursor-pointer ${
                gamePin.status === "available"
                  ? "bg-green-500/20 border-green-500/40 hover:bg-green-500/30"
                  : "bg-red-500/20 border-red-500/40 hover:bg-red-500/30"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    gamePin.status === "available" ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="text-text-main font-mono text-lg font-semibold">
                  {gamePin.pin}
                </span>
              </div>
              
              <div className="text-right">
                <span
                  className={`text-sm font-medium ${
                    gamePin.status === "available"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {gamePin.status === "available" ? "Available" : "Full"}
                </span>
                <div className="text-xs text-text-secondary mt-1">
                  {gamePin.status === "available" ? "2/8 players" : "8/8 players"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 