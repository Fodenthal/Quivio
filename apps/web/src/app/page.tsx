"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameConnectionContext } from "@/contexts/GameConnectionContext";
import { ConnectionStatus } from "@/lib/gameClient";
import { GameLayout } from "./components/GameLayout";
import { Homepage } from "./components/Homepage";

export default function Home() {
  const router = useRouter();
  const [shouldNavigateToGame, setShouldNavigateToGame] = useState(false);
  
  const { 
    connectionStatus, 
    gameState,
    currentPlayerId,
    joinRoom, 
    createRoom,
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

  // Controlled navigation effect - only triggers when explicitly requested
  useEffect(() => {
    if (shouldNavigateToGame && connectionStatus === ConnectionStatus.CONNECTED && gameState?.gamePin) {
      const playerName = Array.from(gameState.players.values()).find(p => p.id === currentPlayerId)?.name || "Player";
      router.push(`/game/${gameState.gamePin}?player=${encodeURIComponent(playerName)}`);
      setShouldNavigateToGame(false); // Reset flag
    }
  }, [shouldNavigateToGame, connectionStatus, gameState?.gamePin, currentPlayerId, router, gameState?.players]);

  // Adapter functions that handle room joining/creation and navigation
  const handleJoinRoom = async (playerName: string, gamePin: string) => {
    try {
      await joinRoom({ playerName, gamePin });
      // Navigate to game page with URL parameters (immediate for joins since we have the pin)
      router.push(`/game/${gamePin}?player=${encodeURIComponent(playerName)}`);
    } catch (error) {
      // Stay on homepage if join fails - error will be shown by Homepage component
      throw error;
    }
  };

  const handleCreateRoom = async (roomName: string, hostName: string, topics: string[], difficulty: number, isPrivate: boolean) => {
    try {
      await createRoom({ roomName, hostName, topics, difficulty, isPrivate });
      // Trigger controlled navigation
      setShouldNavigateToGame(true);
    } catch (error) {
      // Stay on homepage if creation fails - error will be shown by Homepage component  
      throw error;
    }
  };

  // REMOVED: Automatic navigation effect that caused competing navigation issues
  // Navigation is now handled explicitly in join/create handlers

  // Show Homepage when disconnected, GameLayout when connected
  if (connectionStatus === ConnectionStatus.DISCONNECTED) {
    return (
      <Homepage
        onJoinRoom={handleJoinRoom}
        onCreateRoom={handleCreateRoom}
      />
    );
  }

  // Handle leaving game from homepage (should redirect if connected)
  const handleLeaveGameFromHome = async () => {
    await leaveRoom();
    // Already on homepage, just refresh state
  };

  return (
    <GameLayout 
      connectionStatus={connectionStatus}
      gameState={gameState}
      currentPlayerId={currentPlayerId}
      // Actions
      onLeaveGame={handleLeaveGameFromHome}
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
