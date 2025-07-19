"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GameClient, ConnectionStatus } from "@/lib/gameClient";
import { GameState } from "@shared/index";
import { convertColyseusState } from "@/utils/gameStateConverter";

export interface UseGameConnectionReturn {
  // State
  connectionStatus: ConnectionStatus;
  gameState: GameState | null;
  currentPlayerId: string;
  gameClient: GameClient;
  
  // Room actions
  joinRoom: (params: { playerName: string; gamePin: string }) => Promise<void>;
  createRoom: (params: { roomName: string; hostName: string; topics: string[]; difficulty: number; isPrivate: boolean }) => Promise<void>;
  leaveRoom: () => Promise<void>;
  
  // Game actions
  sendPlayerReady: (ready: boolean) => Promise<void>;
  startGame: () => void;
  submitGuess: (guess: string) => void;
  joinNextGame: () => void;
  setTopic: (topic: string) => void;
  setTopics: (topics: string[]) => void;
  setDifficulty: (difficulty: number) => void;
  sendChatMessage: (content: string) => Promise<void>;
}

/**
 * Custom hook that manages all game connection state and provides a centralized API
 * for interacting with the game client. This hook consolidates connection management,
 * state conversion, and game actions that were previously duplicated across components.
 * 
 * @returns Object containing connection state and game action methods
 */
export function useGameConnection(): UseGameConnectionReturn {
  const [gameClient] = useState(() => new GameClient());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED
  );
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>("");
  
  // Use ref to track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Set up event handlers for connection status changes
  useEffect(() => {
    gameClient.setEventHandlers({
      onConnectionStatusChange: (status) => {
        if (!isMountedRef.current) return;
        
        setConnectionStatus(status);
        // Clear game state when disconnected to ensure clean return to join form
        if (status === ConnectionStatus.DISCONNECTED) {
          setGameState(null);
          setCurrentPlayerId("");
        }
      },
      onStateChange: (state) => {
        if (!isMountedRef.current) return;
        
        const convertedState = convertColyseusState(state);
        setGameState(convertedState);
      },
      onError: (error) => {
        console.error("Game client error:", error);
      },
    });

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      gameClient.dispose();
    };
  }, [gameClient]);

  // Get current player ID from the room
  useEffect(() => {
    const room = gameClient.getRoom();
    if (room && room.sessionId && isMountedRef.current) {
      setCurrentPlayerId(room.sessionId);
    }
  }, [gameClient, connectionStatus]);

  // Room actions
  const joinRoom = useCallback(async ({ playerName, gamePin }: { playerName: string; gamePin: string }) => {
    try {
      await gameClient.joinRoom({
        playerName,
        gamePin,
      });
    } catch (error) {
      console.error("Failed to join room:", error);
      throw error; // Re-throw so caller can handle it
    }
  }, [gameClient]);

  const createRoom = useCallback(async ({ roomName, hostName, topics, difficulty, isPrivate }: { roomName: string; hostName: string; topics: string[]; difficulty: number; isPrivate: boolean }) => {
    try {
      // Use the provided hostName instead of generating a unique one
      await gameClient.createRoom({
        playerName: hostName,
        roomName,
        topics,
        difficulty,
        isPrivate,
        maxPlayers: 8
      });
    } catch (error) {
      console.error("Failed to create room:", error);
      throw error; // Re-throw so caller can handle it
    }
  }, [gameClient]);

  const leaveRoom = useCallback(async () => {
    try {
      await gameClient.leaveRoom();
      // Reset local state
      if (isMountedRef.current) {
        setGameState(null);
        setCurrentPlayerId("");
      }
    } catch (error) {
      console.error("Failed to leave game:", error);
      throw error;
    }
  }, [gameClient]);

  // Game actions
  const sendPlayerReady = useCallback(async (ready: boolean) => {
    try {
      gameClient.sendPlayerReady(ready);
    } catch (error) {
      console.error("Failed to update ready state:", error);
      throw error; // Re-throw so caller can handle it
    }
  }, [gameClient]);

  const startGame = useCallback(() => {
    try {
      gameClient.startGame();
    } catch (error) {
      console.error("Failed to start game:", error);
      throw error;
    }
  }, [gameClient]);

  const submitGuess = useCallback((guess: string) => {
    try {
      gameClient.submitGuess(guess);
    } catch (error) {
      console.error("Failed to submit guess:", error);
      throw error; // Re-throw so caller can handle it
    }
  }, [gameClient]);

  const joinNextGame = useCallback(() => {
    try {
      gameClient.joinNextGame();
    } catch (error) {
      console.error("Failed to join next game:", error);
      throw error;
    }
  }, [gameClient]);

  const setTopic = useCallback((topic: string) => {
    try {
      gameClient.setTopic(topic);
    } catch (error) {
      console.error("Failed to set topic:", error);
      throw error;
    }
  }, [gameClient]);

  const setTopics = useCallback((topics: string[]) => {
    try {
      gameClient.setTopics(topics);
    } catch (error) {
      console.error("Failed to set topics:", error);
      throw error;
    }
  }, [gameClient]);

  const setDifficulty = useCallback((difficulty: number) => {
    try {
      gameClient.setDifficulty(difficulty);
    } catch (error) {
      console.error("Failed to set difficulty:", error);
      throw error;
    }
  }, [gameClient]);

  const sendChatMessage = useCallback(async (content: string) => {
    try {
      gameClient.sendChatMessage(content);
    } catch (error) {
      console.error("Failed to send chat message:", error);
      throw error; // Re-throw so caller can handle it
    }
  }, [gameClient]);

  return {
    // State
    connectionStatus,
    gameState,
    currentPlayerId,
    gameClient,
    
    // Room actions
    joinRoom,
    createRoom,
    leaveRoom,
    
    // Game actions
    sendPlayerReady,
    startGame,
    submitGuess,
    joinNextGame,
    setTopic,
    setTopics,
    setDifficulty,
    sendChatMessage,
  };
}
 