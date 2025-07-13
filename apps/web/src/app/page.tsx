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

  const handleCreateRoom = async (topic: string, isPrivate: boolean) => {
    try {
      // TODO: Implement room creation logic
      // For now, we'll just log the room creation attempt
      console.log("Creating room with topic:", topic, "private:", isPrivate);
      
      // Placeholder - in the future this will create a room and then join it
      // await gameClient.createRoom({ topic, isPrivate });
      
      throw new Error("Room creation not implemented yet");
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
