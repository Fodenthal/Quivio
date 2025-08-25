"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useGameConnectionContext } from "@/contexts/GameConnectionContext";
import { ConnectionStatus } from "@/lib/gameClient";
import { GameLayout } from "../../components/GameLayout";

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const gamePin = params.gamePin as string;
  
  const { 
    connectionStatus, 
    gameState,
    currentPlayerId,
    leaveRoom,
    startGame,
    submitGuess,
    setTopics,
    setDifficulty,
    setTargetScore,
    setRoundTime,
    setMaxPlayers,
    sendChatMessage
  } = useGameConnectionContext();

  // Extract player name from URL parameters or use stored display name
  const playerNameFromUrl = searchParams.get('player');

  useEffect(() => {
    // Auto-join logic will be implemented in Phase 3
    // For now, redirect to home if not connected
    if (connectionStatus === ConnectionStatus.DISCONNECTED) {
      // TODO: In Phase 3, implement automatic reconnection here
      console.log(`Game page loaded for pin: ${gamePin}, player: ${playerNameFromUrl}`);
    }
  }, [gamePin, playerNameFromUrl, connectionStatus]);

  // Handle leaving game - navigate back to home
  const handleLeaveGame = async () => {
    await leaveRoom();
    router.push('/');
  };

  // Show loading state while determining connection status
  if (connectionStatus === ConnectionStatus.DISCONNECTED) {
    return (
      <div className="min-h-dvh safe-bottom flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-glass p-8 border border-white/20">
          <h2 className="text-3xl font-bold text-text-main mb-4 text-center">
            Loading Game...
          </h2>
          <p className="text-text-secondary text-center">
            Game Pin: {gamePin}
          </p>
          <p className="text-text-secondary text-center text-sm mt-2">
            Attempting to connect to the game room.
          </p>
        </div>
      </div>
    );
  }

  // Show game interface when connected
  return (
    <GameLayout 
      connectionStatus={connectionStatus}
      gameState={gameState}
      currentPlayerId={currentPlayerId}
      onLeaveGame={handleLeaveGame}
      onStartGame={startGame}
      onSubmitGuess={submitGuess}
      onSetTopics={setTopics}
      onSetDifficulty={setDifficulty}
      onSetTargetScore={setTargetScore}
      onSetRoundTime={setRoundTime}
      onSetMaxPlayers={setMaxPlayers}
      onSendChatMessage={sendChatMessage}
    />
  );
}
