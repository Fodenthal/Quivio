"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameConnectionContext } from "@/contexts/GameConnectionContext";
import { ConnectionStatus } from "@/lib/gameClient";
import { Homepage } from "./components/Homepage";

export default function Home() {
  const router = useRouter();
  const [shouldNavigateToGame, setShouldNavigateToGame] = useState(false);
  
  const { 
    connectionStatus, 
    gameState,
    currentPlayerId,
    joinRoom, 
    createRoom
  } = useGameConnectionContext();

  // Navigation effect for room creation - navigates when room is ready
  useEffect(() => {
    if (shouldNavigateToGame && connectionStatus === ConnectionStatus.CONNECTED && gameState?.gamePin) {
      const playerName = Array.from(gameState.players.values()).find(p => p.id === currentPlayerId)?.name || "Player";
      router.push(`/game/${gameState.gamePin}?player=${encodeURIComponent(playerName)}`);
      setShouldNavigateToGame(false); // Reset flag
    }
  }, [shouldNavigateToGame, connectionStatus, gameState?.gamePin, currentPlayerId, router, gameState?.players]);

  // Navigation handler for joining existing rooms
  const handleJoinRoom = async (playerName: string, gamePin: string) => {
    try {
      await joinRoom({ playerName, gamePin });
      // Navigate to game page immediately (we know the pin)
      router.push(`/game/${gamePin}?player=${encodeURIComponent(playerName)}`);
    } catch (error) {
      // Stay on homepage if join fails - error will be shown by Homepage component
      throw error;
    }
  };

  // Navigation handler for creating new rooms
  const handleCreateRoom = async (roomName: string, hostName: string, topics: string[], difficulty: number, isPrivate: boolean) => {
    try {
      await createRoom({ roomName, hostName, topics, difficulty, isPrivate });
      // Trigger navigation once connected
      setShouldNavigateToGame(true);
    } catch (error) {
      // Stay on homepage if creation fails - error will be shown by Homepage component  
      throw error;
    }
  };

  // Root page always shows Homepage - game interface is handled by /game/[gamePin]
  return (
    <Homepage
      onJoinRoom={handleJoinRoom}
      onCreateRoom={handleCreateRoom}
    />
  );
}
