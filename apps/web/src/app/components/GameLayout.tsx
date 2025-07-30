"use client";

import { ConnectionStatus } from "@/lib/gameClient";
import { GameView } from "./GameView";
import { GameState } from "@shared/index";
import { UserDisplayName } from "./UserDisplayName";
import { ThemeToggle } from "./ThemeToggle";

export interface GameLayoutProps {
  connectionStatus: ConnectionStatus;
  gameState: GameState | null;
  currentPlayerId: string;
  // Actions
  onLeaveGame: () => void;
  onStartGame: () => void;
  onSubmitGuess: (guess: string) => void;
  onSetTopics: (topics: string[]) => void;
  onSetDifficulty: (difficulty: number) => void;
  onSetTargetScore?: (score: number) => void;
  onSetRoundTime?: (seconds: number) => void;
  onSetMaxPlayers?: (maxPlayers: number) => void;
  onSendChatMessage: (content: string) => void;
}

export function GameLayout({ 
  connectionStatus,
  gameState,
  currentPlayerId,
  onLeaveGame,
  onStartGame,
  onSubmitGuess,
  onSetTopics,
  onSetDifficulty,
  onSetTargetScore,
  onSetRoundTime,
  onSetMaxPlayers,
  onSendChatMessage
}: GameLayoutProps) {
  // This component receives all state and actions as props from a parent component
  // that uses the useGameConnection hook. It focuses purely on game UI rendering.

  const getStatusColor = (status: ConnectionStatus) => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return "bg-success";
      case ConnectionStatus.CONNECTING:
      case ConnectionStatus.RECONNECTING:
        return "bg-warning";
      case ConnectionStatus.ERROR:
        return "bg-error";
      default:
        return "bg-light-text-muted dark:bg-dark-text-muted";
    }
  };

  const getStatusText = (status: ConnectionStatus) => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return "Connected";
      case ConnectionStatus.CONNECTING:
        return "Connecting...";
      case ConnectionStatus.RECONNECTING:
        return "Reconnecting...";
      case ConnectionStatus.ERROR:
        return "Connection Error";
      default:
        return "Disconnected";
    }
  };

  // Determine which view to show
  const renderMainContent = () => {
    if (connectionStatus === ConnectionStatus.CONNECTED && gameState) {
      // Always show unified GameView - it handles all game states internally
      return (
        <GameView
          gameState={gameState}
          currentPlayerId={currentPlayerId}
          onSubmitGuess={onSubmitGuess}
          onSendChatMessage={onSendChatMessage}
          onStartGame={onStartGame}
          onSetTopics={onSetTopics}
          onSetDifficulty={onSetDifficulty}
          onSetTargetScore={onSetTargetScore}
          onSetRoundTime={onSetRoundTime}
          onSetMaxPlayers={onSetMaxPlayers}
        />
      );
    }

    // Show loading/connecting state
    return (
      <div className="card p-8 text-center animate-cursor-in">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-light-accent-primary/30 dark:border-dark-accent-primary/30 border-t-light-accent-primary dark:border-t-dark-accent-primary rounded-full animate-spin"></div>
          <h2 className="heading-cursor text-2xl">
            Connecting...
          </h2>
          <p className="text-cursor-secondary">
            Please wait while we connect you to the game.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Header with Cursor-style design */}
      <header className="header-cursor">
        <div className="container-cursor">
          <div className="flex items-center justify-between h-20">
            <div className="flex flex-col">
              <h1 className="heading-cursor-lg text-light-accent-primary dark:text-dark-accent-primary">Quivio</h1>
              <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm font-medium">Limitless Trivia</p>
            </div>
            
            <div className="flex-cursor">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* User Display Name - shown when connected */}
              {connectionStatus === ConnectionStatus.CONNECTED && (
                <UserDisplayName />
              )}
              
              {/* Leave Game Button - shown when connected */}
              {connectionStatus === ConnectionStatus.CONNECTED && (
                <button
                  onClick={onLeaveGame}
                  className="btn-ghost px-4 py-2 text-sm"
                >
                  Leave Game
                </button>
              )}
              
              {/* Connection Status Indicator */}
              <div className="flex-cursor">
                <div
                  className={`w-3 h-3 rounded-full ${getStatusColor(connectionStatus)} animate-pulse`}
                />
                <span className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
                  {getStatusText(connectionStatus)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="container-cursor section-cursor">
        {renderMainContent()}
      </main>
    </div>
  );
}
