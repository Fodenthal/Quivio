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
    joinRoom, 
    createRoom,
    leaveRoom,
    sendPlayerReady,
    startGame,
    submitGuess,
    joinNextGame,
    setTopic,
    setTopics,
    setDifficulty,
    sendChatMessage
  } = useGameConnection();

  // Adapter functions to match Homepage prop types
  const handleJoinRoom = async (playerName: string, gamePin: string) => {
    await joinRoom({ playerName, gamePin });
  };
  const handleCreateRoom = async (roomName: string, hostName: string, topics: string[], difficulty: number, isPrivate: boolean) => {
    await createRoom({ roomName, hostName, topics, difficulty, isPrivate });
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
      onSetTopics={setTopics}
      onSetDifficulty={setDifficulty}
      onSendChatMessage={sendChatMessage}
    />
  );
}
