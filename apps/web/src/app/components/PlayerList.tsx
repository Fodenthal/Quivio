"use client";

import { GameState, PlayerData } from "@shared/index";

interface PlayerListProps {
  gameState: GameState;
  participatingPlayers: Map<string, boolean>;
  showParticipationStatus: boolean;
}

export function PlayerList({ 
  gameState, 
  participatingPlayers,
  showParticipationStatus
}: PlayerListProps) {

  const playersArray = Array.from(gameState.players.values())
    .filter(player => player && player.id)
    .sort((a, b) => b.score - a.score);

  const getPlayerAvatar = (player: PlayerData) => {
    const firstLetter = player.name.charAt(0).toUpperCase();
    const colors = [
      "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
      "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500"
    ];
    const colorIndex = player.name.length % colors.length;
    const bgColor = colors[colorIndex];

    return (
      <div className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
        {firstLetter}
      </div>
    );
  };

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-glass p-6 border border-white/20">
      <h3 className="text-2xl font-bold text-text-main mb-4">Players</h3>
      <div className="space-y-4">
        {playersArray.map((player, index) => (
          <div
            key={`${player.id}-${index}`}
            className="flex items-center justify-between p-3 bg-black/20 rounded-lg"
          >
            <div className="flex items-center space-x-4">
              {getPlayerAvatar(player)}
              <div>
                <div className="font-semibold text-text-main">{player.name}</div>
                {gameState.playerIncorrectGuesses.has(player.id) && (
                  <div className="text-sm text-text-secondary">
                    {gameState.playerIncorrectGuesses.get(player.id)?.guess}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-xl font-bold text-text-main">{player.score}</div>
              {showParticipationStatus && (
                <div className="text-sm font-medium">
                  {participatingPlayers.has(player.id) ? (
                    <span className="text-green-400">Joined!</span>
                  ) : (
                    <span className="text-text-secondary">...</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}