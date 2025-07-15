"use client";

import { useState, useEffect } from "react";
import { GameClient, ConnectionStatus } from "@/lib/gameClient";
import { GameLayout } from "./components/GameLayout";
import { Homepage } from "./components/Homepage";

export default function Home() {
  const [gameClient] = useState(() => new GameClient());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED
  );

  useEffect(() => {
    // Set up connection status listener
    gameClient.setEventHandlers({
      onConnectionStatusChange: (status) => {
        setConnectionStatus(status);
      },
      onStateChange: () => {
        // GameLayout will handle state changes
      },
      onError: (error) => {
        console.error("Game client error:", error);
      },
    });

    // Cleanup on unmount
    return () => {
      gameClient.dispose();
    };
  }, [gameClient]);

  const handleJoinRoom = async (playerName: string, gamePin: string) => {
    try {
      await gameClient.joinRoom({
        playerName,
        gamePin,
      });
    } catch (error) {
      console.error("Failed to join room:", error);
      throw error; // Re-throw so Homepage can handle it
    }
  };

  const handleCreateRoom = async (topic: string, difficulty: number, isPrivate: boolean) => {
    try {
      // Create a room with the host as the first player
      const playerName = `Host_${Math.random().toString(36).substring(2, 8)}`;
      
      await gameClient.createRoom({
        playerName,
        topic,
        difficulty,
        isPrivate,
        maxPlayers: 8
      });
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

  return <GameLayout gameClient={gameClient} />;
}
