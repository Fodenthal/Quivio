"use client";

import { GameState, PlayerData } from "@shared/index";
import { memo, useMemo } from "react";

interface PlayerListProps {
  gameState: GameState;
  participatingPlayers: Map<string, boolean>;
  showParticipationStatus: boolean;
}

const PlayerListComponent = memo(function PlayerListInner({ 
  gameState, 
  participatingPlayers,
  showParticipationStatus
}: PlayerListProps) {

  const playersArray = useMemo(() => {
    return Array.from(gameState.players.values())
      .filter(player => player && player.id)
      .sort((a, b) => b.score - a.score);
  }, [gameState.players]);

  const getPlayerAvatar = (player: PlayerData) => {
    const firstLetter = player.name.charAt(0).toUpperCase();
    // Expanded color palette for more visual variety
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
        <div className={`w-12 h-12 rounded-lg ${bgColor} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
          {firstLetter}
        </div>
        {/* Score positioned at bottom-left corner of avatar */}
        <div className="absolute -bottom-2.5 -left-2 w-7 h-6 flex items-center justify-center text-sm font-bold text-white bg-black/70 rounded border border-white/20">
          {player.score}
        </div>
      </div>
    );
  };

  /**
   * Check if a player has submitted a correct answer this round
   */
  const hasPlayerAnsweredCorrectly = useMemo(() => {
    return (playerId: string): boolean => {
      const playerGuess = gameState.roundGuesses.get(playerId);
      return playerGuess?.isCorrect === true;
    };
  }, [gameState.roundGuesses]);

  /**
   * Get the truncated incorrect guess for display
   */
  const getTruncatedIncorrectGuess = useMemo(() => {
    return (playerId: string): string => {
      const incorrectGuess = gameState.playerIncorrectGuesses.get(playerId);
      if (!incorrectGuess?.guess) return "";
      
      // Truncate long guesses to prevent layout overflow
      const maxLength = 14;
      if (incorrectGuess.guess.length > maxLength) {
        return incorrectGuess.guess.substring(0, maxLength) + "...";
      }
      return incorrectGuess.guess;
    };
  }, [gameState.playerIncorrectGuesses]);

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-glass p-6 border border-white/20">
      <h3 className="text-2xl font-bold text-text-main mb-4">Players</h3>
      <div className="space-y-4">
        {playersArray.map((player, index) => {
          const hasCorrectAnswer = hasPlayerAnsweredCorrectly(player.id);
          const incorrectGuess = getTruncatedIncorrectGuess(player.id);
          
          return (
            <div
              key={`${player.id}-${index}`}
              className={`flex items-center space-x-4 p-3 rounded-lg transition-colors duration-75 ${
                hasCorrectAnswer 
                  ? "bg-pink-500/20 border border-pink-500/30 shadow-lg" 
                  : "bg-black/20"
              }`}
            >
              {getPlayerAvatar(player)}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-text-main">{player.name}</div>
                <div className="text-sm text-text-secondary h-5 overflow-hidden">
                  {incorrectGuess && (
                    <span className="block truncate">{incorrectGuess}</span>
                  )}
                </div>
              </div>
              {/* Participation status positioned on the right */}
              {showParticipationStatus && (
                <div className="text-sm font-medium flex-shrink-0">
                  {participatingPlayers.has(player.id) ? (
                    <span className="text-green-400">Joined!</span>
                  ) : (
                    <span className="text-text-secondary">...</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.showParticipationStatus === nextProps.showParticipationStatus &&
    prevProps.gameState.players.size === nextProps.gameState.players.size &&
    prevProps.gameState.roundGuesses.size === nextProps.gameState.roundGuesses.size &&
    prevProps.gameState.playerIncorrectGuesses.size === nextProps.gameState.playerIncorrectGuesses.size &&
    prevProps.participatingPlayers.size === nextProps.participatingPlayers.size &&
    // Check if player scores have changed
    Array.from(prevProps.gameState.players.values()).every((prevPlayer) => {
      const nextPlayer = nextProps.gameState.players.get(prevPlayer.id);
      return nextPlayer && prevPlayer.score === nextPlayer.score;
    })
  );
});

// Set display name for React DevTools
PlayerListComponent.displayName = 'PlayerList';

export { PlayerListComponent as PlayerList };