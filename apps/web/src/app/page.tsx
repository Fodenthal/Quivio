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
    createRoom,
    leaveRoom
  } = useGameConnectionContext();

  // Homepage cleanup effect - leave room if user navigated back to homepage via browser navigation
  useEffect(() => {
    // Only cleanup if we're connected to a game but landed on homepage
    // This handles back button navigation from game page
    if (connectionStatus === ConnectionStatus.CONNECTED && gameState?.gamePin) {
      console.log(`🔙 User navigated to homepage while connected to ${gameState.gamePin}, leaving room`);
      leaveRoom().catch(error => {
        console.error("Failed to leave room during homepage cleanup:", error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - only run once on mount to handle browser navigation

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
