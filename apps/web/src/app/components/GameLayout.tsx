"use client";

import { ConnectionStatus } from "@/lib/gameClient";
import { GameView } from "./GameView";
import { GameState } from "@shared/index";

export interface GameLayoutProps {
  connectionStatus: ConnectionStatus;
  gameState: GameState | null;
  currentPlayerId: string;
  // Actions
  onLeaveGame: () => void;
  onStartGame: () => void;
  onSubmitGuess: (guess: string) => void;
  onSetTopic: (topic: string) => void;
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
  onSetTopic,
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
        return "bg-green-500";
      case ConnectionStatus.CONNECTING:
      case ConnectionStatus.RECONNECTING:
        return "bg-yellow-500";
      case ConnectionStatus.ERROR:
        return "bg-red-500";
      default:
        return "bg-gray-500";
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
          onSetTopic={onSetTopic}
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
      <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-glass p-8 border border-white/20">
        <h2 className="text-3xl font-bold text-text-main mb-4 text-center">
          Connecting...
        </h2>
        <p className="text-text-secondary text-center">
          Please wait while we connect you to the game.
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Header with connection status */}
      <header className="bg-white/5 backdrop-blur-xl shadow-glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <h1 className="text-3xl font-bold text-primary">Quivio</h1>
            
            <div className="flex items-center space-x-4">
              {/* Leave Game Button - shown when connected */}
              {connectionStatus === ConnectionStatus.CONNECTED && (
                <button
                  onClick={onLeaveGame}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-main hover:bg-white/10 rounded-md transition-colors"
                >
                  Leave Game
                </button>
              )}
              
              {/* Connection Status Indicator */}
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${getStatusColor(connectionStatus)}`}
                />
                <span className="text-sm font-medium text-text-secondary">
                  {getStatusText(connectionStatus)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {renderMainContent()}
      </main>
    </div>
  );
}
