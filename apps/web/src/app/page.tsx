"use client";

import { useGameConnection } from "@/hooks/useGameConnection";
import { ConnectionStatus } from "@/lib/gameClient";
import { GameLayout } from "./components/GameLayout";
import { Homepage } from "./components/Homepage";

export default function Home() {
  const { 
    connectionStatus, 
    gameState,
    currentPlayerId,
    gameClient, // Keep for now, for GameLayout
    joinRoom, 
    createRoom,
    leaveRoom,
    sendPlayerReady,
    startGame,
    submitGuess,
    joinNextGame,
    setTopic,
    setDifficulty,
    sendChatMessage
  } = useGameConnection();

  const handleJoinRoom = async (playerName: string, gamePin: string) => {
    try {
      await joinRoom({ playerName, gamePin });
    } catch (error) {
      console.error("Failed to join room:", error);
      throw error; // Re-throw so Homepage can handle it
    }
  };

  const handleCreateRoom = async (topic: string, difficulty: number, isPrivate: boolean) => {
    try {
      await createRoom({ topic, difficulty, isPrivate });
    } catch (error) {
      console.error("Failed to create room:", error);
      throw error; // Re-throw so Homepage can handle it
    }
  };

  // Show Homepage when disconnected, GameLayout when connected
  if (connectionStatus === ConnectionStatus.DISCONNECTED) {
    return (
      <Homepage
        onJoinRoom={handleJoinRoom}
        onCreateRoom={handleCreateRoom}
      />
    );
  }

  return (
    <GameLayout 
      connectionStatus={connectionStatus}
      gameState={gameState}
      currentPlayerId={currentPlayerId}
      // Actions
      onLeaveGame={leaveRoom}
      onPlayerReady={sendPlayerReady}
      onStartGame={startGame}
      onSubmitGuess={submitGuess}
      onJoinNextGame={joinNextGame}
      onSetTopic={setTopic}
      onSetDifficulty={setDifficulty}
      onSendChatMessage={sendChatMessage}
    />
  );
}
