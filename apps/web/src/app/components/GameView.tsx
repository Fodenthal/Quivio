"use client";

import { useState } from "react";
import { GameState } from "@shared/index";
import { PlayerList } from "./PlayerList";

interface GameViewProps {
  gameState: GameState;
  currentPlayerId: string;
  onSubmitGuess?: (guess: string) => void;
}

/**
 * GameView component displays the active game interface when a trivia game is in progress.
 * Shows the current prompt, round information, timer, and game state indicators.
 * 
 * @param gameState - The current game state containing prompt, round info, and player data
 * @param currentPlayerId - The session ID of the current player
 * @param onSubmitGuess - Callback function to submit a guess to the server
 * @returns React component displaying the active game interface
 */
export function GameView({ 
  gameState, 
  currentPlayerId,
  onSubmitGuess
}: GameViewProps) {
  const [currentGuess, setCurrentGuess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  /**
   * Determines the current game phase for display purposes.
   * Helps users understand what's happening in the game at any given moment.
   * 
   * @returns String describing the current game phase
   */
  const getGamePhase = (): string => {
    if (gameState.gameEnded) return "ended";
    if (gameState.gamePaused) return "paused";
    if (gameState.roundEnded) return "round-ended";
    if (gameState.roundStartTime > 0) return "playing";
    return "waiting";
  };

  /**
   * Gets the appropriate styling classes for the current game phase.
   * Provides visual feedback about the game state to users.
   * 
   * @returns Object containing CSS classes for game phase styling
   */
  const getGamePhaseStyles = () => {
    const phase = getGamePhase();
    switch (phase) {
      case "playing":
        return {
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          textColor: "text-green-800",
          icon: "🎮"
        };
      case "round-ended":
        return {
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200", 
          textColor: "text-blue-800",
          icon: "⏸️"
        };
      case "paused":
        return {
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          textColor: "text-yellow-800",
          icon: "⏸️"
        };
      case "ended":
        return {
          bgColor: "bg-purple-50",
          borderColor: "border-purple-200",
          textColor: "text-purple-800",
          icon: "🏁"
        };
      default:
        return {
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          textColor: "text-gray-800",
          icon: "⏳"
        };
    }
  };

  /**
   * Formats the remaining time for display.
   * Converts milliseconds to a human-readable format.
   * 
   * @param timeMs - Time in milliseconds
   * @returns Formatted time string (e.g., "0:30")
   */
  const formatTime = (timeMs: number): string => {
    const seconds = Math.max(0, Math.ceil(timeMs / 1000));
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Handles guess form submission with validation and error handling.
   * Prevents duplicate submissions and validates input before sending to server.
   * 
   * @param e - Form submission event
   */
  const handleGuessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentGuess.trim() || isSubmitting || !onSubmitGuess) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmitGuess(currentGuess.trim());
      setCurrentGuess(""); // Clear input on successful submission
    } catch (error) {
      console.error("Failed to submit guess:", error);
      // Keep the guess in the input so user can try again
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Checks if the current player has already submitted a guess for this round.
   * Used to disable input and show feedback after guess submission.
   * 
   * @returns Boolean indicating if current player has guessed
   */
  const hasPlayerGuessed = (): boolean => {
    return gameState.roundGuesses.has(currentPlayerId);
  };

  /**
   * Gets the current player's guess state for the round.
   * Used to display feedback about whether their guess was correct.
   * 
   * @returns GuessState object if player has guessed, undefined otherwise
   */
  const getPlayerGuess = () => {
    return gameState.roundGuesses.get(currentPlayerId);
  };

  const currentPlayer = gameState.players.get(currentPlayerId);
  const phaseStyles = getGamePhaseStyles();
  const phase = getGamePhase();

  return (
    <div className="flex gap-6">
      {/* Main Game Content */}
      <div className="flex-1 bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Game Header with Round Info */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-semibold text-gray-800">
            Round {gameState.currentRound}
          </h2>
          
          {/* Timer Display */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-600">Time:</span>
            <span className={`text-lg font-bold ${
              gameState.roundTimeRemaining < 10000 ? 'text-red-600' : 'text-gray-800'
            }`}>
              {formatTime(gameState.roundTimeRemaining)}
            </span>
          </div>
        </div>

        {/* Game Phase Indicator */}
        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border ${phaseStyles.bgColor} ${phaseStyles.borderColor}`}>
          <span className="text-sm">{phaseStyles.icon}</span>
          <span className={`text-sm font-medium ${phaseStyles.textColor}`}>
            {phase === "playing" && "Round in Progress"}
            {phase === "round-ended" && "Round Ended"}
            {phase === "paused" && "Game Paused"}
            {phase === "ended" && "Game Finished"}
            {phase === "waiting" && "Waiting for Next Round"}
          </span>
        </div>
      </div>

      {/* Current Prompt Display */}
      {gameState.currentPrompt && gameState.currentPrompt.text && (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="text-center space-y-4">
            {/* Prompt Category */}
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-sm font-medium">
              📂 {gameState.currentPrompt.category || "General"}
            </div>
            
            {/* Prompt Text */}
            <h3 className="text-xl font-semibold text-gray-900">
              {gameState.currentPrompt.text}
            </h3>
            
            {/* Difficulty Indicator */}
            <div className="flex justify-center">
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                gameState.currentPrompt.difficulty === "easy" 
                  ? "bg-green-100 text-green-800"
                  : gameState.currentPrompt.difficulty === "medium"
                  ? "bg-yellow-100 text-yellow-800" 
                  : "bg-red-100 text-red-800"
              }`}>
                {gameState.currentPrompt.difficulty?.toUpperCase() || "EASY"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Round Results Section - shown when round has ended */}
      {phase === "round-ended" && gameState.correctAnswer && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-center">
            <h4 className="text-lg font-medium text-green-900 mb-2">Round Complete!</h4>
            <p className="text-green-800">
              The correct answer was: <span className="font-semibold">{gameState.correctAnswer}</span>
            </p>
          </div>
        </div>
      )}

      {/* Game End Section - shown when game is finished */}
      {phase === "ended" && gameState.winnerId && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="text-center space-y-3">
            <h3 className="text-xl font-semibold text-purple-900">🎉 Game Complete!</h3>
            {(() => {
              const winner = gameState.players.get(gameState.winnerId);
              return winner ? (
                <p className="text-purple-800">
                  <span className="font-semibold">{winner.name}</span> wins with {winner.score} points!
                </p>
              ) : (
                <p className="text-purple-800">Game finished!</p>
              );
            })()}
          </div>
        </div>
      )}

      {/* Current Player Status */}
      {currentPlayer && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-blue-900">Your Score</span>
              <div className="text-2xl font-bold text-blue-900">{currentPlayer.score}</div>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-blue-900">Target</span>
              <div className="text-lg font-semibold text-blue-900">{gameState.targetScore}</div>
            </div>
          </div>
        </div>
      )}

      {/* Guess Input Section - shown during active play AND when paused */}
      {(phase === "playing" || phase === "paused") && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {hasPlayerGuessed() ? (
            // Show guess feedback when player has already guessed
            <div className="text-center space-y-3">
              {(() => {
                const playerGuess = getPlayerGuess();
                return playerGuess ? (
                  <>
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                      playerGuess.isCorrect 
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : "bg-red-100 text-red-800 border border-red-200"
                    }`}>
                      {playerGuess.isCorrect ? "✅ Correct!" : "❌ Incorrect"}
                    </div>
                    <p className="text-gray-600">
                      Your guess: <span className="font-medium">{playerGuess.guess}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      {phase === "paused" ? "Game is paused..." : "Waiting for round to end..."}
                    </p>
                  </>
                ) : null;
              })()}
            </div>
          ) : (
            // Show guess input form when player hasn't guessed yet
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 text-center">
                Submit Your Guess
              </h4>
              {phase === "paused" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800 text-center">
                    ⏸️ Game is paused - waiting for other players to reconnect
                  </p>
                </div>
              )}
              <form onSubmit={handleGuessSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={currentGuess}
                    onChange={(e) => setCurrentGuess(e.target.value)}
                    placeholder="Enter your answer..."
                    disabled={isSubmitting || phase === "paused"}
                    className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    autoComplete="off"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {phase === "paused" 
                      ? "Input disabled while game is paused"
                      : "Press Enter or click Submit to send your answer"
                    }
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={!currentGuess.trim() || isSubmitting || phase === "paused"}
                  className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? "Submitting..." : phase === "paused" ? "Game Paused" : "Submit Guess"}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
      </div>

      {/* Player List Sidebar */}
      <div className="w-96 bg-white rounded-lg shadow-md p-6">
        <PlayerList 
          gameState={gameState}
        />
      </div>
    </div>
  );
}