"use client";

import { useState, useEffect } from "react";

interface GamePin {
  id: string;
  pin: string;
  status: "available" | "full";
  currentPrompt?: string;
  difficulty?: number; // 1-10 scale
}

// Sample prompts with 1-10 difficulty ratings
const samplePrompts = [
  { text: "Ancient Egyptian Mythology", difficulty: 6 },
  { text: "The Beatles White Album", difficulty: 5 },
  { text: "Quant Interview Probability Questions", difficulty: 9 },
  { text: "Modern Art History: 1900-1950", difficulty: 7 },
  { text: "Chinese Dynasties: Ming to Qing", difficulty: 8 },
  { text: "Classic Rock Guitar Solos", difficulty: 4 },
  { text: "World War II Pacific Theater", difficulty: 7 },
  { text: "French Impressionist Painters", difficulty: 6 },
  { text: "Quantum Physics Basics", difficulty: 8 },
  { text: "Greek Philosophy: Plato & Aristotle", difficulty: 7 },
  { text: "MrBeast childhood", difficulty: 6 },
  { text: "History's most evil people", difficulty: 5 },
  { text: "Modern Cryptography", difficulty: 9 },
  { text: "Renaissance Art & Culture", difficulty: 6 },
  { text: "Classic Literature Themes", difficulty: 5 },
];

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
      const prompt = samplePrompts[i % samplePrompts.length];
      pins.push({
        id: `pin-${i}`,
        pin: generateGamePin(),
        status: i < 8 ? "available" : "full",
        currentPrompt: prompt.text,
        difficulty: prompt.difficulty
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
      
      <div className="h-[calc(100%-4rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent pr-2">
        <div className="space-y-2 p-2 pr-4">
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

              {/* Prompt and difficulty in the middle */}
              <div className="flex-1 mx-4 min-w-0">
                {gamePin.currentPrompt && (
                  <div className="text-center">
                    <p className="text-text-main text-sm truncate italic">
                      &ldquo;{gamePin.currentPrompt}&rdquo;
                    </p>
                    <span className="text-xs text-text-secondary">
                      Difficulty: {gamePin.difficulty}/10
                    </span>
                  </div>
                )}
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