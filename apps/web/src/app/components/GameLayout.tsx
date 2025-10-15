"use client";

import { useEffect } from "react";
import { ConnectionStatus } from "@/lib/gameClient";
import { GameView } from "./GameView";
import { GameState } from "@shared/index";
import { GameUserDropdown } from "./GameUserDropdown";
import { QuivioLogo } from "./QuivioLogo";
import { useFooterVisibility } from "@/contexts/FooterVisibilityContext";

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

  const { setIsVisible } = useFooterVisibility();

  useEffect(() => {
    setIsVisible(false);

    return () => {
      setIsVisible(true);
    };
  }, [setIsVisible]);


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
    <div className="h-lvh flex flex-col safe-bottom overflow-hidden">
      {/* Header with connection status */}
      <header className="bg-white/5 backdrop-blur-xl safe-top relative z-50 flex-shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-0.8">
              <QuivioLogo 
                size={48} 
                className="text-indigo-400 flex-shrink-0" 
              />
              <h1 className="text-lg sm:text-xl font-bold text-indigo-400 leading-none -translate-y-0.5">
                Quivio
              </h1>
            </div>
            
            <GameUserDropdown 
              onLeaveGame={onLeaveGame}
              connectionStatus={
                connectionStatus === ConnectionStatus.CONNECTED ? 'connected' :
                connectionStatus === ConnectionStatus.CONNECTING ? 'connecting' :
                connectionStatus === ConnectionStatus.ERROR ? 'error' :
                'disconnected'
              }
            />
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 w-full min-h-0">
        {/* Unified game container */}
        <div className="bg-white/5 backdrop-blur-sm h-full">
          {renderMainContent()}
        </div>
      </main>
    </div>
  );
}
