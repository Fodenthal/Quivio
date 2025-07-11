"use client";

import { useState } from "react";
import { GameState } from "@shared/index";
import { PlayerList } from "./PlayerList";
import { WinnerScreen } from "./WinnerScreen";

interface GameViewProps {
  gameState: GameState;
  currentPlayerId: string;
  onSubmitGuess?: (guess: string) => void;
  onJoinNextGame?: () => void;
}

export function GameView({ 
  gameState, 
  currentPlayerId,
  onSubmitGuess,
  onJoinNextGame
}: GameViewProps) {
  const [currentGuess, setCurrentGuess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const getGamePhase = (): string => {
    if (gameState.gameEnded) return "ended";
    if (gameState.gamePaused) return "paused";
    if (gameState.roundEnded) return "round-ended";
    if (gameState.roundStartTime > 0) return "playing";
    return "waiting";
  };

  const formatTime = (timeMs: number): string => {
    const seconds = Math.max(0, Math.ceil(timeMs / 1000));
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGuessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentGuess.trim() || isSubmitting || !onSubmitGuess) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmitGuess(currentGuess.trim());
      setCurrentGuess("");
    } catch (error) {
      console.error("Failed to submit guess:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasPlayerGuessed = (): boolean => {
    return gameState.roundGuesses.has(currentPlayerId);
  };

  const getPlayerGuess = () => {
    return gameState.roundGuesses.get(currentPlayerId);
  };

  const currentPlayer = gameState.players.get(currentPlayerId);
  const phase = getGamePhase();

  return (
    <div className="flex gap-8">
      <div className="relative flex-1 bg-white/10 backdrop-blur-xl rounded-lg shadow-glass p-8 border border-white/20 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/20">
          <h2 className="text-3xl font-bold text-text-main">
            Round {gameState.currentRound}
          </h2>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-medium text-text-secondary">Time:</span>
            <span className={`text-2xl font-bold ${
              gameState.roundTimeRemaining < 10000 ? 'text-red-500' : 'text-text-main'
            }`}>
              {formatTime(gameState.roundTimeRemaining)}
            </span>
          </div>
        </div>

        {gameState.currentPrompt && gameState.currentPrompt.text && (
          <div className="bg-black/20 rounded-lg p-6 text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-medium mb-4">
              {gameState.currentPrompt.category || "General"}
            </div>
            <h3 className="text-2xl font-semibold text-text-main">
              {gameState.currentPrompt.text}
            </h3>
          </div>
        )}

        {phase === "round-ended" && gameState.correctAnswer && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center">
            <h4 className="text-xl font-medium text-green-300 mb-2">Round Complete!</h4>
            <p className="text-text-secondary">
              The correct answer was: <span className="font-bold text-text-main">{gameState.correctAnswer}</span>
            </p>
          </div>
        )}

        {phase === "ended" && gameState.winnerId && (() => {
          const winner = gameState.players.get(gameState.winnerId);
          return winner ? (
            <WinnerScreen 
              winner={winner}
              restartCountdown={gameState.restartCountdown}
              participatingPlayers={gameState.participatingPlayers}
              currentPlayerId={currentPlayerId}
              onJoinNextGame={onJoinNextGame || (() => {})}
            />
          ) : null;
        })()}

        {currentPlayer && (
          <div className="bg-black/20 rounded-lg p-4 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-text-secondary">Your Score</span>
              <div className="text-2xl font-bold text-text-main">{currentPlayer.score}</div>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-text-secondary">Target</span>
              <div className="text-lg font-semibold text-text-main">{gameState.targetScore}</div>
            </div>
          </div>
        )}

        {(phase === "playing" || phase === "paused") && (
          <div className="bg-black/20 rounded-lg p-6">
            {hasPlayerGuessed() ? (
              <div className="text-center space-y-3">
                {(() => {
                  const playerGuess = getPlayerGuess();
                  return playerGuess ? (
                    <>
                      <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                        playerGuess.isCorrect 
                          ? "bg-green-500/20 text-green-300 border border-green-500/30"
                          : "bg-red-500/20 text-red-300 border border-red-500/30"
                      }`}>
                        {playerGuess.isCorrect ? "✅ Correct!" : "❌ Incorrect"}
                      </div>
                      <p className="text-text-secondary">
                        Your guess: <span className="font-medium text-text-main">{playerGuess.guess}</span>
                      </p>
                    </>
                  ) : null;
                })()}
              </div>
            ) : (
              <form onSubmit={handleGuessSubmit} className="space-y-4">
                <input
                  type="text"
                  value={currentGuess}
                  onChange={(e) => setCurrentGuess(e.target.value)}
                  placeholder="Enter your answer..."
                  disabled={isSubmitting || phase === "paused"}
                  className="w-full px-4 py-3 text-lg bg-white/10 border border-white/20 rounded-lg text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  autoComplete="off"
                  maxLength={100}
                />
                <button
                  type="submit"
                  disabled={!currentGuess.trim() || isSubmitting || phase === "paused"}
                  className="w-full px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Submitting..." : "Submit Guess"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      <div className="w-96">
        <PlayerList 
          gameState={gameState}
          participatingPlayers={gameState.participatingPlayers}
          showParticipationStatus={phase === "ended"}
        />
      </div>
    </div>
  );
}