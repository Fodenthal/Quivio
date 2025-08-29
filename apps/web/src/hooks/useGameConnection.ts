"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GameClient, ConnectionStatus } from "@/lib/gameClient";
import { GameState } from "@shared/index";
import { convertColyseusState } from "@/utils/gameStateConverter";
import { GameSessionStorage } from "@/utils/gameSessionStorage";

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
  
  // Session management
  attemptReconnection: () => Promise<boolean>;
  hasStoredSession: () => boolean;
  getRecentGames: () => import("@/utils/gameSessionStorage").RecentGame[];
  
  // Game actions
  sendPlayerReady: (ready: boolean) => Promise<void>;
  startGame: () => void;
  submitGuess: (guess: string) => void;
  joinNextGame: () => void;
  setTopic: (topic: string) => void;
  setTopics: (topics: string[]) => void;
  setDifficulty: (difficulty: number) => void;
  setTargetScore: (score: number) => void;
  setRoundTime: (seconds: number) => void;
  setMaxPlayers: (maxPlayers: number) => void;
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

  // Save session data when connected and have game state
  useEffect(() => {
    if (connectionStatus === ConnectionStatus.CONNECTED && gameState && currentPlayerId) {
      const currentPlayer = gameState.players.get(currentPlayerId);
      const room = gameClient.getRoom();
      
      if (currentPlayer && gameState.gamePin && room) {
        // Save current session data with reconnection token for Colyseus reconnection
        GameSessionStorage.saveCurrentSession({
          gamePin: gameState.gamePin,
          playerName: currentPlayer.name,
          playerId: currentPlayerId,
          roomId: room.roomId, // Actual Colyseus room ID
          reconnectionToken: room.reconnectionToken, // Colyseus reconnection token
          hostId: gameState.hostId,
          lastConnected: Date.now(),
          currentRound: gameState.currentRound,
          playerScore: currentPlayer.score,
          gameStatus: gameState.gameStatus
        });

        // Save to recent games list
        GameSessionStorage.addRecentGame({
          gamePin: gameState.gamePin,
          roomName: gameState.roomName,
          playerName: currentPlayer.name,
          isHost: currentPlayer.isHost
        });

        // Save player name for future use
        GameSessionStorage.saveLastPlayerName(currentPlayer.name);
      }
    }
  }, [connectionStatus, gameState, currentPlayerId]);

  // Clear session data when disconnected (with delay to allow for reconnection attempts)
  useEffect(() => {
    if (connectionStatus === ConnectionStatus.DISCONNECTED) {
      // Delay session clearing to allow for page refreshes and temporary disconnections
      const clearDelay = setTimeout(() => {
        if (connectionStatus === ConnectionStatus.DISCONNECTED) {
          console.log("🗑️ Clearing session storage after disconnection timeout");
          GameSessionStorage.clearCurrentSession();
        }
      }, 5000); // 5 second delay
      
      return () => clearTimeout(clearDelay);
    }
  }, [connectionStatus]);

  // Room actions with automatic reconnection logic
  const joinRoom = useCallback(async ({ playerName, gamePin }: { playerName: string; gamePin: string }) => {
    try {
      // First, check if we have a stored session for this exact game pin
      const storedSession = GameSessionStorage.getCurrentSession();
      
      if (storedSession && storedSession.gamePin === gamePin && storedSession.reconnectionToken) {
        try {
          console.log(`🔄 Found stored session for ${gamePin}, attempting reconnection...`);
          await gameClient.reconnect(storedSession.reconnectionToken);
          console.log(`✅ Successfully reconnected to existing session`);
          return; // Success! We're reconnected to the same session
        } catch (reconnectError) {
          console.log(`❌ Reconnection failed: ${reconnectError instanceof Error ? reconnectError.message : String(reconnectError)}`);
          console.log(`🔄 Falling back to fresh connection...`);
          // Clear stale session data
          GameSessionStorage.clearCurrentSession();
        }
      }

      // Fallback: Create fresh connection
      console.log(`🚪 Creating fresh connection to ${gamePin}...`);
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
      // Clear session storage when intentionally leaving
      GameSessionStorage.clearCurrentSession();
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
    console.log('🎮 useGameConnection.startGame() called');
    try {
      console.log('🎮 Calling gameClient.startGame()...');
      gameClient.startGame();
      console.log('🎮 gameClient.startGame() completed successfully');
    } catch (error) {
      console.error("🎮 Failed to start game:", error);
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

  const setTargetScore = useCallback((score: number) => {
    try {
      gameClient.setTargetScore(score);
    } catch (error) {
      console.error("Failed to set target score:", error);
      throw error;
    }
  }, [gameClient]);

  const setRoundTime = useCallback((seconds: number) => {
    try {
      gameClient.setRoundTime(seconds);
    } catch (error) {
      console.error("Failed to set round time:", error);
      throw error;
    }
  }, [gameClient]);

  const setMaxPlayers = useCallback((maxPlayers: number) => {
    try {
      gameClient.setMaxPlayers(maxPlayers);
    } catch (error) {
      console.error("Failed to set max players:", error);
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

  // Session management functions
  const attemptReconnection = useCallback(async (): Promise<boolean> => {
    const storedSession = GameSessionStorage.getCurrentSession();
    
    try {
      if (!storedSession || !storedSession.reconnectionToken) {
        console.log("❌ No stored session data for Colyseus reconnection");
        return false;
      }

      console.log(`🔄 Attempting Colyseus reconnection using token ${storedSession.reconnectionToken.slice(0, 8)}...`);
      await gameClient.reconnect(storedSession.reconnectionToken);
      
      console.log(`✅ Colyseus reconnection successful to ${storedSession.gamePin}`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const gamePin = storedSession?.gamePin || 'unknown';
      console.error(`❌ Colyseus reconnection failed for ${gamePin}:`, errorMessage);
      
      // Enhanced error handling for specific cases
      if (errorMessage.includes('not found') || errorMessage.includes('does not exist') || errorMessage.includes('reconnect')) {
        console.log("🗑️ Room disposed or session expired - clearing stale session data");
        GameSessionStorage.clearCurrentSession();
      } else if (errorMessage.includes('full') || errorMessage.includes('capacity')) {
        console.log("🚫 Room is full - keeping session data for retry");
        // Don't clear session data for full rooms - user might want to retry
      } else {
        console.log("🧹 Clearing session data due to unknown reconnection error");
        GameSessionStorage.clearCurrentSession();
      }
      
      return false;
    }
  }, [gameClient]);

  const hasStoredSession = useCallback((): boolean => {
    return GameSessionStorage.hasActiveSession();
  }, []);

  const getRecentGames = useCallback(() => {
    return GameSessionStorage.getRecentGames();
  }, []);

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
    
    // Session management
    attemptReconnection,
    hasStoredSession,
    getRecentGames,
    
    // Game actions
    sendPlayerReady,
    startGame,
    submitGuess,
    joinNextGame,
    setTopic,
    setTopics,
    setDifficulty,
    setTargetScore,
    setRoundTime,
    setMaxPlayers,
    sendChatMessage,
  };
}
 