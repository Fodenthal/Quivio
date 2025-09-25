"use client";

import { ConnectionStatus } from "@/lib/gameClient";
import { GameView } from "./GameView";
import { GameState } from "@shared/index";
import { GameUserDropdown } from "./GameUserDropdown";
import { QuivioLogo } from "./QuivioLogo";

export interface GameLayoutProps {
  connectionStatus: ConnectionStatus;
  gameState: GameState | null;
  currentPlayerId: string;
  // Actions
  onLeaveGame: () => void;
  onStartGame: () => void;
  onSubmitGuess: (guess: string) => void;
  onSetTopics: (topics: string[]) => void;
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
  onSetTargetScore,
  onSetRoundTime,
  onSetMaxPlayers,
  onSendChatMessage
}: GameLayoutProps) {
  // This component receives all state and actions as props from a parent component
  // that uses the useGameConnection hook. It focuses purely on game UI rendering.


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
    <div className="min-h-lvh safe-bottom">
      {/* Header with connection status */}
      <header className="bg-white/5 backdrop-blur-xl shadow-glass border-b border-white/10 safe-top relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-1 sm:gap-2">
              <QuivioLogo 
                size={60} 
                className="text-indigo-400 translate-y-[1px] sm:translate-y-[2px] sm:w-20 sm:h-20" 
              />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-indigo-400">
                Quivio
              </h1>
            </div>
            
            <GameUserDropdown 
              onLeaveGame={onLeaveGame}
              connectionStatus={
                connectionStatus === ConnectionStatus.CONNECTED ? 'connected' :
                connectionStatus === ConnectionStatus.CONNECTING ? 'connecting' : 
                'disconnected'
              }
            />
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
