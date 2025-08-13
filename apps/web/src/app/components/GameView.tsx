"use client";

import { useState, useMemo, useCallback, memo, useRef, useEffect } from "react";
import { GameState, GameStatus } from "@shared/index";
import { PlayerList } from "./PlayerList";
import { WinnerScreen } from "./WinnerScreen";
import { Chat } from "./Chat";
import { GamePins } from "./GamePins";
import { AISettingsPanel } from "./AISettingsPanel";

interface GameViewProps {
  gameState: GameState;
  currentPlayerId: string;
  // Game actions
  onSubmitGuess?: (guess: string) => void;
  onSendChatMessage?: (content: string) => void;
  // Lobby actions
  onStartGame?: () => void;
  onSetTopics?: (topics: string[]) => void;
  onSetDifficulty?: (difficulty: number) => void;
  onSetTargetScore?: (score: number) => void;
  onSetRoundTime?: (seconds: number) => void;
  onSetMaxPlayers?: (maxPlayers: number) => void;
}

export const GameView = memo(function GameView({ 
  gameState, 
  currentPlayerId,
  onSubmitGuess,
  onSendChatMessage,
  onStartGame,
  onSetTopics,
  onSetDifficulty,
  onSetTargetScore,
  onSetRoundTime,
  onSetMaxPlayers
}: GameViewProps) {
  const [currentGuess, setCurrentGuess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatHasFocus, setChatHasFocus] = useState(false);
  const [activePanel, setActivePanel] = useState<'players' | 'chat'>("players");
  
  const guessInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const getGamePhase = useMemo((): string => {
    if (gameState.gameStatus === GameStatus.GAME_ENDED) return "ended";
    if (gameState.gamePaused) return "paused";
    if (gameState.roundEnded) return "round-ended";
    // Add loading phase for when game started but questions are being generated
    if (gameState.gameStatus === GameStatus.IN_PROGRESS && (!gameState.currentPrompt?.text || gameState.currentPrompt.text === "")) return "loading";
    if (gameState.roundStartTime > 0) return "playing";
    return "waiting";
  }, [gameState.gameStatus, gameState.gamePaused, gameState.roundEnded, gameState.currentPrompt?.text, gameState.roundStartTime]);

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



  // Find who got the answer first
  const firstCorrectPlayer = useMemo(() => {
    if (!gameState.roundEnded) return null;
    
    // Get all correct guesses and find the earliest one
    const correctGuesses = Array.from(gameState.roundGuesses.entries())
      .filter((entry) => entry[1] && entry[1].isCorrect)
      .sort((a, b) => (a[1]?.timestamp || 0) - (b[1]?.timestamp || 0));
    
    if (correctGuesses.length === 0) return null;
    
    const firstCorrectPlayerId = correctGuesses[0][0];
    return gameState.players.get(firstCorrectPlayerId);
  }, [gameState.roundEnded, gameState.roundGuesses, gameState.players]);



  // Select a random encouraging message based on current round
  // Freeze the message during answer display to prevent flash when currentRound increments
  const selectedEncouragingMessage = useMemo(() => {
    if (phase !== "round-ended") return "";
    
    // Use the round that just ended (currentRound - 1) to get the stable encouraging message
    // This prevents the message from changing when currentRound increments in startNewRound()
    const roundForMessage = Math.max(0, gameState.currentRound - 1);
    const index = roundForMessage % encouragingMessages.length;
    return encouragingMessages[index];
  }, [gameState.currentRound, encouragingMessages, phase]);

  // Auto-focus management and input clearing
  useEffect(() => {
    // Clear any remaining input text when a new round starts
    if (phase === "playing" && !hasPlayerGuessed) {
      setCurrentGuess("");
    }
    
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

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 h-full min-h-[60dvh]">
      {/* Main game content - flex-1 */}
      <div className="relative flex-1 bg-white/10 backdrop-blur-xl rounded-lg shadow-glass p-8 border border-white/20 space-y-6 h-full min-h-[60dvh] flex flex-col">
        
        {/* Winner Screen - Show when game has ended */}
        {phase === "ended" && gameState.winnerId && (() => {
          const winner = gameState.players.get(gameState.winnerId);
          return winner ? (
            <WinnerScreen 
              winner={winner}
              restartCountdown={gameState.restartCountdown}
            />
          ) : null;
        })()}

        {/* Waiting for Players Panel */}
        {gameState.gameStatus === GameStatus.WAITING && (() => {
          const currentPlayer = gameState.players.get(currentPlayerId);
          const isHost = currentPlayer?.isHost || false;
          const playerCount = gameState.players.size;
          const hasMinPlayers = playerCount >= 2;
          const hasTopics = gameState.topics && gameState.topics.length > 0 && gameState.topics.some(topic => topic.trim().length > 0);
          const canStartGame = hasMinPlayers && hasTopics && isHost;

          return (
            <div className="flex flex-col h-full">
              {/* Unified View for All Players */}
              <div className="flex flex-col flex-grow space-y-6">
                <div className="relative flex-grow">
                  {/* Game Pin Display in top-right corner of this container */}
                  {gameState.gamePin && (
                    <div className="absolute top-0 right-0">
                      <GamePins gamePin={gameState.gamePin} />
                    </div>
                  )}
                  <AISettingsPanel 
                    gameState={gameState}
                    isReadOnly={!isHost}
                    onSetTopics={isHost ? onSetTopics : undefined}
                    onSetDifficulty={isHost ? onSetDifficulty : undefined}
                    onSetTargetScore={isHost ? onSetTargetScore : undefined}
                    onSetRoundTime={isHost ? onSetRoundTime : undefined}
                    onSetMaxPlayers={isHost ? onSetMaxPlayers : undefined}
                  />
                </div>
                
                {/* Start Game Button and Status Messages - Host Only */}
                {isHost && (
                  <div className="mt-auto pt-6 border-t border-white/20">
                    <button
                      onClick={onStartGame}
                      disabled={!canStartGame}
                      className={`w-full px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background ${
                        canStartGame
                          ? "bg-primary hover:bg-opacity-90 text-white focus:ring-primary"
                          : "bg-gray-600 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      Start Game
                    </button>
                    <div className="mt-4 space-y-1 text-center">
                      {!hasMinPlayers && (
                        <p className="text-yellow-300 text-sm">
                          Need {2 - playerCount} more player{2 - playerCount !== 1 ? 's' : ''} to start.
                        </p>
                      )}
                      {!hasTopics && (
                        <p className="text-yellow-300 text-sm">
                          Please set at least one topic to start the game.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Existing game content - only show when not in lobby and not ended */}
        {gameState.gameStatus !== GameStatus.WAITING && phase !== "ended" && (
          <>
            <div className="flex items-center justify-between pb-4 border-b border-white/20">
              <h2 className="text-3xl font-bold text-text-main">
                Round {gameState.currentRound}
              </h2>
              {/* Only show timer if not loading/AD */}
              {phase !== "loading" && (
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-medium text-text-secondary">Time:</span>
                  <span className={`text-2xl font-bold ${
                    timerDisplay.isUrgent ? 'text-red-500' : 'text-text-main'
                  }`}>
                    {timerDisplay.time}
                  </span>
                </div>
              )}
            </div>

            {/* Question Display Panel or Ad Placeholder */}
            {phase === "loading" ? (
              // Ad placeholder during question generation
              <div className="bg-black/20 rounded-lg p-8 text-center min-h-[260px] md:min-h-[360px] lg:min-h-[420px] flex flex-col justify-center">
                <div className="flex-grow flex flex-col justify-center">
                  <h2 className="text-8xl font-bold text-text-main tracking-wider">
                    AD
                  </h2>
                  <p className="text-lg text-text-secondary mt-4">
                    Questions are loading...
                  </p>
                </div>
              </div>
            ) : gameState.currentPrompt && gameState.currentPrompt.text && (
              <div className="bg-black/20 rounded-lg p-8 text-center min-h-[260px] md:min-h-[360px] lg:min-h-[420px] flex flex-col justify-center">
                {gameState.roundEnded && gameState.correctAnswer ? (
                  // Answer reveal after round ends
                  <div>
                    <div className="text-lg text-text-main font-medium mb-1">
                      The answer was
                    </div>
                    <h2 className="text-4xl font-bold text-text-main leading-relaxed">
                      {gameState.correctAnswer}
                    </h2>
                    <div className="text-lg text-text-secondary font-medium mt-4">
                      {firstCorrectPlayer ? (
                        <span>{firstCorrectPlayer.name} found it first.</span>
                      ) : (
                        <span>no one got it</span>
                      )}
                    </div>

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
              <div className="bg-black/20 rounded-lg p-6 min-h-[76px] md:min-h-[92px] flex flex-col justify-center">
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
          </>
        )}
      </div>

      {/* md-only right column wrapper with toggle above the panel */}
      <div className="hidden md:flex lg:hidden flex-col md:w-80 min-h-[60dvh]">
        <div className="mb-2 self-stretch flex justify-end">
          <div className="inline-flex bg-white/10 border border-white/20 rounded-md p-1">
            <button
              type="button"
              onClick={() => setActivePanel('players')}
              aria-pressed={activePanel === 'players'}
              className={`px-3 py-1 text-sm rounded ${activePanel === 'players' ? 'bg-white/20 text-text-main' : 'text-text-secondary hover:bg-white/10'}`}
            >
              Players
            </button>
            <button
              type="button"
              onClick={() => setActivePanel('chat')}
              aria-pressed={activePanel === 'chat'}
              className={`ml-1 px-3 py-1 text-sm rounded ${activePanel === 'chat' ? 'bg-white/20 text-text-main' : 'text-text-secondary hover:bg-white/10'}`}
            >
              Chat
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          {activePanel === 'players' ? (
            <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-glass p-6 border border-white/20 h-full flex flex-col">
              <PlayerList 
                gameState={gameState}
                participatingPlayers={gameState.participatingPlayers}
                showParticipationStatus={phase === "ended"}
              />
            </div>
          ) : (
            <div ref={chatContainerRef} className="bg-white/10 backdrop-blur-xl rounded-lg shadow-glass p-6 border border-white/20 h-full flex flex-col">
              <Chat
                messages={chatMessages}
                currentPlayerId={currentPlayerId}
                onSendMessage={handleSendMessage}
                disabled={false}
                shouldAutoFocus={chatHasFocus}
              />
            </div>
          )}
        </div>
      </div>

      {/* PlayerList - desktop only */}
      <div className={`hidden lg:flex w-full lg:w-72 h-full min-h-[60dvh] flex-col`}>
        <PlayerList 
          gameState={gameState}
          participatingPlayers={gameState.participatingPlayers}
          showParticipationStatus={phase === "ended"}
        />
      </div>

      {/* Chat Panel - desktop only */}
      <div 
        ref={chatContainerRef}
        className={`hidden lg:flex w-full lg:w-80 bg-white/10 backdrop-blur-xl rounded-lg shadow-glass p-6 border border-white/20 h-full min-h-[60dvh] flex-col`}
      >
        <Chat
          messages={chatMessages}
          currentPlayerId={currentPlayerId}
          onSendMessage={handleSendMessage}
          disabled={false}
          shouldAutoFocus={chatHasFocus}
        />
      </div>

      {/* Phone controls: floating toggle for Players/Chat */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-10 md:hidden">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-2 py-1 flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setActivePanel('players')}
            aria-label="Show players"
            className={`px-3 py-2 text-sm rounded-full ${activePanel === 'players' ? 'bg-white/20 text-text-main' : 'text-text-secondary'}`}
          >
            Players
          </button>
          <button
            type="button"
            onClick={() => setActivePanel('chat')}
            aria-label="Show chat"
            className={`px-3 py-2 text-sm rounded-full ${activePanel === 'chat' ? 'bg-white/20 text-text-main' : 'text-text-secondary'}`}
          >
            Chat
          </button>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  // Only re-render if critical game state properties have changed
  return (
    prevProps.currentPlayerId === nextProps.currentPlayerId &&
    prevProps.gameState.currentRound === nextProps.gameState.currentRound &&
    prevProps.gameState.gameStatus === nextProps.gameState.gameStatus &&
    prevProps.gameState.gamePaused === nextProps.gameState.gamePaused &&
    prevProps.gameState.roundEnded === nextProps.gameState.roundEnded &&
    prevProps.gameState.roundStartTime === nextProps.gameState.roundStartTime &&
    Math.floor(prevProps.gameState.roundTimeRemaining / 1000) === Math.floor(nextProps.gameState.roundTimeRemaining / 1000) && // Only re-render on second changes, not millisecond changes
    prevProps.gameState.currentPrompt?.text === nextProps.gameState.currentPrompt?.text &&
    prevProps.gameState.correctAnswer === nextProps.gameState.correctAnswer &&
    prevProps.gameState.winnerId === nextProps.gameState.winnerId &&
    prevProps.gameState.restartCountdown === nextProps.gameState.restartCountdown &&
    prevProps.gameState.targetScore === nextProps.gameState.targetScore &&
    
    // CRITICAL: Player state comparisons for lobby functionality
    prevProps.gameState.players.size === nextProps.gameState.players.size &&
    Array.from(prevProps.gameState.players.entries()).every(([playerId, prevPlayer]) => {
      const nextPlayer = nextProps.gameState.players.get(playerId);
      return nextPlayer && 
        prevPlayer.name === nextPlayer.name && 
        prevPlayer.isHost === nextPlayer.isHost &&
        prevPlayer.score === nextPlayer.score;
    }) &&
    // Topics changes affect lobby start button
    prevProps.gameState.topics?.length === nextProps.gameState.topics?.length &&
    prevProps.gameState.topics?.every((topic, index) => topic === nextProps.gameState.topics?.[index]) &&

    prevProps.gameState.roundGuesses.get(prevProps.currentPlayerId) === nextProps.gameState.roundGuesses.get(nextProps.currentPlayerId) &&
    prevProps.gameState.roundGuesses.size === nextProps.gameState.roundGuesses.size &&
    prevProps.gameState.playerIncorrectGuesses.size === nextProps.gameState.playerIncorrectGuesses.size &&
    // Check for incorrect guesses content changes
    Array.from(prevProps.gameState.playerIncorrectGuesses.entries()).every(([playerId, prevGuess]) => {
      const nextGuess = nextProps.gameState.playerIncorrectGuesses.get(playerId);
      return nextGuess && prevGuess.guess === nextGuess.guess && prevGuess.timestamp === nextGuess.timestamp;
    }) &&
    prevProps.gameState.chatMessages.size === nextProps.gameState.chatMessages.size &&
    // Check for game settings changes that should trigger re-renders
    prevProps.gameState.targetScore === nextProps.gameState.targetScore &&
    prevProps.gameState.roundTime === nextProps.gameState.roundTime &&
    prevProps.gameState.maxPlayers === nextProps.gameState.maxPlayers &&
    prevProps.gameState.currentDifficulty === nextProps.gameState.currentDifficulty &&
    prevProps.onSubmitGuess === nextProps.onSubmitGuess &&
    prevProps.onSendChatMessage === nextProps.onSendChatMessage &&
    // Lobby action comparisons
    prevProps.onStartGame === nextProps.onStartGame &&
    prevProps.onSetTopics === nextProps.onSetTopics &&
    prevProps.onSetDifficulty === nextProps.onSetDifficulty &&
    prevProps.onSetTargetScore === nextProps.onSetTargetScore &&
    prevProps.onSetRoundTime === nextProps.onSetRoundTime &&
    prevProps.onSetMaxPlayers === nextProps.onSetMaxPlayers
  );
});