"use client";

import { useState } from "react";
import { ConnectionStatus } from "@/lib/gameClient";
import { GameLobby } from "./GameLobby";
import { GameView } from "./GameView";
import { GameState } from "@shared/index";

export interface GameLayoutProps {
  connectionStatus: ConnectionStatus;
  gameState: GameState | null;
  currentPlayerId: string;
  // Actions
  onLeaveGame: () => void;
  onPlayerReady: (ready: boolean) => void;
  onStartGame: () => void;
  onSubmitGuess: (guess: string) => void;
  onJoinNextGame: () => void;
  onSetTopic: (topic: string) => void;
  onSetDifficulty: (difficulty: number) => void;
  onSendChatMessage: (content: string) => void;
}

export function GameLayout({ 
  connectionStatus,
  gameState,
  currentPlayerId,
  onLeaveGame,
  onPlayerReady,
  onStartGame,
  onSubmitGuess,
  onJoinNextGame,
  onSetTopic,
  onSetDifficulty,
  onSendChatMessage
}: GameLayoutProps) {
  const [playerName, setPlayerName] = useState("");
  const [gamePin, setGamePin] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // This component no longer manages its own connection or game state.
  // All state and actions are passed in as props from a parent component
  // that uses the useGameConnection hook.

  // The join form logic remains here for now, but could be extracted
  // to a separate component in a future refactor.
  const handleJoinGame = async () => {
    // This handler will be removed when the join form is moved.
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isJoining) {
      handleJoinGame();
    }
  };

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
    if (connectionStatus === ConnectionStatus.DISCONNECTED) {
      return (
        <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-glass p-8 border border-white/20 max-w-md mx-auto">
          <h2 className="text-3xl font-bold text-text-main mb-6 text-center">Join Game</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Your Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={20}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isJoining}
            />
            <input
              type="text"
              placeholder="Game PIN"
              value={gamePin}
              onChange={(e) => setGamePin(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isJoining}
            />
            <button
              onClick={handleJoinGame}
              className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
              disabled={!playerName.trim() || !gamePin.trim() || isJoining}
            >
              {isJoining ? "Joining..." : "Enter"}
            </button>
          </div>
        </div>
      );
    }

    if (connectionStatus === ConnectionStatus.CONNECTED && gameState) {
      if (!gameState.gameStarted && !gameState.gameEnded) {
        // Show lobby when connected but game hasn't started and hasn't ended
        return (
          <GameLobby
            gameState={gameState}
            currentPlayerId={currentPlayerId}
            onPlayerReady={onPlayerReady}
            onStartGame={onStartGame}
            onSetTopic={onSetTopic}
            onSetDifficulty={onSetDifficulty}
          />
        );
      } else {
        // Show game interface when game has started OR when game has ended (for winner screen)
        return (
          <GameView
            gameState={gameState}
            currentPlayerId={currentPlayerId}
            onSubmitGuess={onSubmitGuess}
            onJoinNextGame={onJoinNextGame}
            onSendChatMessage={onSendChatMessage}
          />
        );
      }
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
            <h1 className="text-3xl font-bold text-primary">PopReplay</h1>
            
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
