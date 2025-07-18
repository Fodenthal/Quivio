"use client";

import { useState, useMemo, useCallback, memo, useRef, useEffect } from "react";
import { GameState } from "@shared/index";
import { PlayerList } from "./PlayerList";
import { WinnerScreen } from "./WinnerScreen";
import { Chat } from "./Chat";

interface GameViewProps {
  gameState: GameState;
  currentPlayerId: string;
  onSubmitGuess?: (guess: string) => void;
  onJoinNextGame?: () => void;
  onSendChatMessage?: (content: string) => void;
}

export const GameView = memo(function GameView({ 
  gameState, 
  currentPlayerId,
  onSubmitGuess,
  onJoinNextGame,
  onSendChatMessage
}: GameViewProps) {
  const [currentGuess, setCurrentGuess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatHasFocus, setChatHasFocus] = useState(false);
  
  const guessInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const getGamePhase = useMemo((): string => {
    if (gameState.gameEnded) return "ended";
    if (gameState.gamePaused) return "paused";
    if (gameState.roundEnded) return "round-ended";
    if (gameState.roundStartTime > 0) return "playing";
    return "waiting";
  }, [gameState.gameEnded, gameState.gamePaused, gameState.roundEnded, gameState.roundStartTime]);

  const formatTime = useCallback((timeMs: number): string => {
    const seconds = Math.max(0, Math.ceil(timeMs / 1000));
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleGuessSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentGuess.trim() || isSubmitting || !onSubmitGuess) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmitGuess(currentGuess.trim());
      setCurrentGuess("");
      // Keep focus on input after submitting
      setTimeout(() => {
        if (guessInputRef.current && !chatHasFocus) {
          guessInputRef.current.focus();
        }
      }, 100);
    } catch (error) {
      console.error("Failed to submit guess:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [currentGuess, isSubmitting, onSubmitGuess, chatHasFocus]);

  const handleGuessKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGuessSubmit(e);
    }
  }, [handleGuessSubmit]);

  const hasPlayerGuessed = useMemo((): boolean => {
    return gameState.roundGuesses.has(currentPlayerId);
  }, [gameState.roundGuesses, currentPlayerId]);

  const getPlayerGuess = useMemo(() => {
    return gameState.roundGuesses.get(currentPlayerId);
  }, [gameState.roundGuesses, currentPlayerId]);

  const promptFontSize = useMemo(() => {
    const textLength = gameState.currentPrompt?.text?.length || 0;
    if (textLength > 150) {
      return "text-2xl";
    }
    return "text-3xl";
  }, [gameState.currentPrompt?.text]);



  const phase = getGamePhase;

  // Random encouraging messages for round-ended feedback
  const encouragingMessages = useMemo(() => [
    "Better luck next time!",
    "Keep it up, you're getting there!",
    "Every guess gets you closer!",
    "Don't give up, you've got this!",
    "Learning with every round!",
    "Stay focused, victory awaits!"
  ], []);

  // Select a random encouraging message based on current round
  const selectedEncouragingMessage = useMemo(() => {
    if (phase !== "round-ended") return "";
    const index = gameState.currentRound % encouragingMessages.length;
    return encouragingMessages[index];
  }, [gameState.currentRound, encouragingMessages, phase]);

  // Auto-focus management
  useEffect(() => {
    // Focus guess input when round starts or when coming back from chat
    if (phase === "playing" && !hasPlayerGuessed && !chatHasFocus) {
      const timer = setTimeout(() => {
        if (guessInputRef.current) {
          guessInputRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [phase, hasPlayerGuessed, chatHasFocus, gameState.currentRound]);

  // Handle chat container clicks to manage focus
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const handleChatClick = () => {
      setChatHasFocus(true);
    };

    const handleDocumentClick = (e: MouseEvent) => {
      if (chatContainer && !chatContainer.contains(e.target as Node)) {
        setChatHasFocus(false);
      }
    };

    chatContainer.addEventListener('click', handleChatClick);
    document.addEventListener('click', handleDocumentClick);

    return () => {
      chatContainer.removeEventListener('click', handleChatClick);
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  // Reset chat focus when new round starts
  useEffect(() => {
    if (phase === "playing" && !hasPlayerGuessed) {
      setChatHasFocus(false);
    }
  }, [gameState.currentRound, phase, hasPlayerGuessed]);

  // Memoize chat messages to prevent unnecessary filtering on every render
  const chatMessages = useMemo(() => {
    return Array.from(gameState.chatMessages.values()).filter(
      (message) => message && typeof message === 'object' && message.id && message.playerName
    );
  }, [gameState.chatMessages]);

  // Memoize the onSendMessage callback to prevent Chat from re-rendering
  const handleSendMessage = useCallback((content: string) => {
    if (onSendChatMessage) {
      onSendChatMessage(content);
    }
  }, [onSendChatMessage]);

  // Memoize timer display to prevent unnecessary re-renders for small time changes
  const timerDisplay = useMemo(() => ({
    time: formatTime(gameState.roundTimeRemaining),
    isUrgent: gameState.roundTimeRemaining < 10000
  }), [gameState.roundTimeRemaining, formatTime]);

  if (phase === "ended" && gameState.winnerId) {
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
  }

  return (
    <div className="flex gap-6">
      {/* Main game content - flex-1 */}
      <div className="relative flex-1 bg-white/10 backdrop-blur-xl rounded-lg shadow-glass p-8 border border-white/20 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/20">
          <h2 className="text-3xl font-bold text-text-main">
            Round {gameState.currentRound}
          </h2>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-medium text-text-secondary">Time:</span>
            <span className={`text-2xl font-bold ${
              timerDisplay.isUrgent ? 'text-red-500' : 'text-text-main'
            }`}>
              {timerDisplay.time}
            </span>
          </div>
        </div>

        {gameState.currentPrompt && gameState.currentPrompt.text && (
          <div className="bg-black/20 rounded-lg p-8 text-center h-[420px] flex flex-col">
            {gameState.roundEnded && gameState.correctAnswer ? (
              // Answer reveal after round ends
              <div className="space-y-4">
                <h4 className="text-lg text-text-secondary font-medium">
                  The answer was:
                </h4>
                <h2 className="text-4xl font-bold text-text-main leading-relaxed">
                  {gameState.correctAnswer}
                </h2>
              </div>
            ) : (
              // Normal question display during round
              <>
                <div className="mb-6">
                  <span className="inline-flex items-center px-4 py-2 rounded-full bg-accent/20 text-accent text-base font-medium">
                    {gameState.currentPrompt.category || "General"}
                  </span>
                </div>
                <div className="flex-grow flex flex-col justify-center">
                  <h3 className={`${promptFontSize} font-semibold text-text-main leading-relaxed`}>
                    {gameState.currentPrompt.text}
                  </h3>
                </div>
              </>
            )}
          </div>
        )}

        {(phase === "playing" || phase === "paused" || phase === "round-ended") && (
          <div className="bg-black/20 rounded-lg p-6 h-[92px] flex flex-col justify-center">
            {phase === "round-ended" ? (
              <div className="text-center">
                {(() => {
                  const playerGuess = getPlayerGuess;
                  if (playerGuess && playerGuess.isCorrect) {
                    return (
                      <p className="text-xl font-medium text-green-300">
                        &quot;{playerGuess.guess}&quot; is correct!
                      </p>
                    );
                  } else {
                    return (
                      <p className="text-xl font-medium text-text-main">
                        {selectedEncouragingMessage}
                      </p>
                    );
                  }
                })()}
              </div>
            ) : hasPlayerGuessed ? (
              <div className="text-center">
                {(() => {
                  const playerGuess = getPlayerGuess;
                  if (!playerGuess) return null;

                  if (playerGuess.isCorrect) {
                    return (
                      <p className="text-xl font-medium text-green-300">
                        &quot;{playerGuess.guess}&quot; is correct!
                      </p>
                    );
                  } else {
                    return (
                      <p className="text-xl font-medium text-red-300">
                        Incorrect. Keep trying!
                      </p>
                    );
                  }
                })()}
              </div>
            ) : (
              <form onSubmit={handleGuessSubmit}>
                <input
                  ref={guessInputRef}
                  type="text"
                  value={currentGuess}
                  onChange={(e) => setCurrentGuess(e.target.value)}
                  onKeyDown={handleGuessKeyDown}
                  placeholder="Enter your answer and press Enter..."
                  disabled={isSubmitting || phase === "paused"}
                  className="w-full px-4 py-3 text-lg bg-white/10 border border-white/20 rounded-lg text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40"
                  autoComplete="off"
                  maxLength={100}
                />
              </form>
            )}
          </div>
        )}
      </div>

      {/* PlayerList - optimized width */}
      <div className="w-72">
        <PlayerList 
          gameState={gameState}
          participatingPlayers={gameState.participatingPlayers}
          showParticipationStatus={phase === "ended"}
        />
      </div>

      {/* Chat Panel */}
      <div 
        ref={chatContainerRef}
        className="w-80 bg-white/10 backdrop-blur-xl rounded-lg shadow-glass p-6 border border-white/20"
      >
        <Chat
          messages={chatMessages}
          currentPlayerId={currentPlayerId}
          onSendMessage={handleSendMessage}
          disabled={false}
          shouldAutoFocus={chatHasFocus}
        />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  // Only re-render if critical game state properties have changed
  return (
    prevProps.currentPlayerId === nextProps.currentPlayerId &&
    prevProps.gameState.currentRound === nextProps.gameState.currentRound &&
    prevProps.gameState.gameEnded === nextProps.gameState.gameEnded &&
    prevProps.gameState.gamePaused === nextProps.gameState.gamePaused &&
    prevProps.gameState.roundEnded === nextProps.gameState.roundEnded &&
    prevProps.gameState.roundStartTime === nextProps.gameState.roundStartTime &&
    Math.floor(prevProps.gameState.roundTimeRemaining / 1000) === Math.floor(nextProps.gameState.roundTimeRemaining / 1000) && // Only re-render on second changes, not millisecond changes
    prevProps.gameState.currentPrompt?.text === nextProps.gameState.currentPrompt?.text &&
    prevProps.gameState.correctAnswer === nextProps.gameState.correctAnswer &&
    prevProps.gameState.winnerId === nextProps.gameState.winnerId &&
    prevProps.gameState.restartCountdown === nextProps.gameState.restartCountdown &&
    prevProps.gameState.targetScore === nextProps.gameState.targetScore &&

    prevProps.gameState.roundGuesses.get(prevProps.currentPlayerId) === nextProps.gameState.roundGuesses.get(nextProps.currentPlayerId) &&
    prevProps.gameState.roundGuesses.size === nextProps.gameState.roundGuesses.size &&
    prevProps.gameState.playerIncorrectGuesses.size === nextProps.gameState.playerIncorrectGuesses.size &&
    // Check for incorrect guesses content changes
    Array.from(prevProps.gameState.playerIncorrectGuesses.entries()).every(([playerId, prevGuess]) => {
      const nextGuess = nextProps.gameState.playerIncorrectGuesses.get(playerId);
      return nextGuess && prevGuess.guess === nextGuess.guess && prevGuess.timestamp === nextGuess.timestamp;
    }) &&
    prevProps.gameState.chatMessages.size === nextProps.gameState.chatMessages.size &&
    prevProps.onSubmitGuess === nextProps.onSubmitGuess &&
    prevProps.onJoinNextGame === nextProps.onJoinNextGame &&
    prevProps.onSendChatMessage === nextProps.onSendChatMessage
  );
});