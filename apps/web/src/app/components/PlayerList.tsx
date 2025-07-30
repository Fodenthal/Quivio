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
        <div className={`w-12 h-12 rounded-lg ${bgColor} flex items-center justify-center text-white font-bold text-xl shadow-cursor`}>
          {firstLetter}
        </div>
        {/* Score positioned at bottom-left corner of avatar */}
        <div className="absolute -bottom-2.5 -left-2 w-7 h-6 flex items-center justify-center text-sm font-bold text-white bg-gray-800 dark:bg-background-secondary/90 rounded border border-gray-600 dark:border-border-primary">
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
      const maxLength = 24;
      if (incorrectGuess.guess.length > maxLength) {
        return incorrectGuess.guess.substring(0, maxLength) + "...";
      }
      return incorrectGuess.guess;
    };
  }, [gameState.playerIncorrectGuesses]);

  return (
    <div className="card p-6 animate-cursor-in">
      <h3 className="heading-cursor text-2xl mb-6">Players</h3>
      <div className="space-y-4">
        {playersArray.map((player, index) => {
          const hasCorrectAnswer = hasPlayerAnsweredCorrectly(player.id);
          const incorrectGuess = getTruncatedIncorrectGuess(player.id);
          
          return (
            <div
              key={`${player.id}-${index}`}
              className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-200 ${
                hasCorrectAnswer 
                  ? "bg-success/20 border border-success/30 shadow-cursor-lg" 
                  : "bg-background-tertiary border border-border-primary"
              }`}
            >
              {getPlayerAvatar(player)}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-text-primary">{player.name}</div>
                <div className="text-sm text-cursor-secondary h-5 overflow-hidden">
                  {incorrectGuess && (
                    <span className="block truncate">{incorrectGuess}</span>
                  )}
                </div>
              </div>
              {/* Participation status positioned on the right */}
              {showParticipationStatus && (
                <div className="text-sm font-medium flex-shrink-0">
                  {participatingPlayers.has(player.id) ? (
                    <span className="text-success">Joined!</span>
                  ) : (
                    <span className="text-cursor-secondary">...</span>
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
    }) &&
    // Check if incorrect guesses content has changed
    Array.from(prevProps.gameState.playerIncorrectGuesses.entries()).every(([playerId, prevGuess]) => {
      const nextGuess = nextProps.gameState.playerIncorrectGuesses.get(playerId);
      return nextGuess && 
             prevGuess.guess === nextGuess.guess && 
             prevGuess.timestamp === nextGuess.timestamp;
    }) &&
    // Check if any new incorrect guesses were added
    Array.from(nextProps.gameState.playerIncorrectGuesses.entries()).every(([playerId, nextGuess]) => {
      const prevGuess = prevProps.gameState.playerIncorrectGuesses.get(playerId);
      return prevGuess && 
             prevGuess.guess === nextGuess.guess && 
             prevGuess.timestamp === nextGuess.timestamp;
    })
  );
});

// Set display name for React DevTools
PlayerListComponent.displayName = 'PlayerList';

export { PlayerListComponent as PlayerList };