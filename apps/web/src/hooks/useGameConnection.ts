"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GameClient, ConnectionStatus } from "@/lib/gameClient";
import { GameState, PlayerData } from "@shared/index";

// Type for Colyseus MapSchema internal structure
interface MapSchemaLike {
  $items?: Map<string, unknown>;
  $indexes?: Map<string, unknown>;
  deletedItems?: unknown;
  [key: string]: unknown;
}

// Type for the raw Colyseus room state as received by the client
interface RawRoomState {
  targetScore?: number;
  roundTime?: number;
  maxPlayers?: number;
  isPrivate?: boolean;
  gameStarted?: boolean;
  gameEnded?: boolean;
  gamePaused?: boolean;
  canStart?: boolean;
  currentRound?: number;
  hostId?: string;
  winnerId?: string;
  restartCountdown?: number;
  participatingPlayers?: MapSchemaLike;
  roundStartTime?: number;
  roundTimeRemaining?: number;
  roundEnded?: boolean;
  correctAnswer?: string;
  currentTopic?: string;
  currentDifficulty?: number;
  players?: MapSchemaLike | Record<string, PlayerData>;
  currentPrompt?: {
    id?: string;
    text?: string;
    category?: string;
    difficulty?: string;
    answer?: string;
    topic?: string;
    difficultyLevel?: number;
    acceptableAnswers?: string[];
  };
  roundGuesses?: MapSchemaLike | Record<string, unknown>;
  playerIncorrectGuesses?: MapSchemaLike | Record<string, unknown>;
  chatMessages?: MapSchemaLike | Record<string, unknown>;
}

/**
 * Converts Colyseus room state to our standardized GameState interface
 * @param state - Raw state from Colyseus room
 * @returns Converted GameState object
 */
function convertColyseusState(state: unknown): GameState | null {
  if (!state || typeof state !== 'object') {
    return null;
  }

  const roomState = state as RawRoomState;
  
  // Convert MapSchema to Map for players
  const playersMap = new Map<string, PlayerData>();
  if (roomState.players) {
    // Handle Colyseus MapSchema properly
    // MapSchema can be iterated directly or we can access its entries
    if (roomState.players instanceof Map) {
      // If it's already a Map, use it directly
      for (const [playerId, player] of roomState.players) {
        playersMap.set(playerId, player as PlayerData);
      }
    } else if (roomState.players && typeof roomState.players === 'object') {
      // If it's a MapSchema, iterate through its actual values
      // MapSchema objects can be iterated with for...in or Object.keys on the actual data
      const playersObj = roomState.players as MapSchemaLike;
     
      // Check if it has $items (Colyseus MapSchema internal structure)
      if (playersObj.$items && playersObj.$items instanceof Map) {
        for (const [playerId, player] of playersObj.$items) {
          if (player && typeof player === 'object') {
            playersMap.set(playerId, player as PlayerData);
          }
        }
      } else {
        // Try direct iteration over the object
        for (const playerId in playersObj) {
          if (playersObj.hasOwnProperty(playerId) && !playerId.startsWith('$') && playerId !== 'deletedItems') {
            const player = playersObj[playerId];
            if (player && typeof player === 'object') {
              playersMap.set(playerId, player as PlayerData);
            }
          }
        }
      }
    }
  }
  
  // Convert other MapSchemas to Maps as needed
  const roundGuesses = new Map();
  if (roomState.roundGuesses) {
    // Handle MapSchema properly - iterate over $items
    if (roomState.roundGuesses.$items && roomState.roundGuesses.$items instanceof Map) {
      for (const [playerId, guess] of roomState.roundGuesses.$items) {
        roundGuesses.set(playerId, guess);
      }
    } else {
      // Fallback for regular objects
      for (const [playerId, guess] of Object.entries(roomState.roundGuesses)) {
        roundGuesses.set(playerId, guess);
      }
    }
  }

  const playerIncorrectGuesses = new Map();
  if (roomState.playerIncorrectGuesses) {
    // Handle MapSchema properly - iterate over $items
    if (roomState.playerIncorrectGuesses.$items && roomState.playerIncorrectGuesses.$items instanceof Map) {
      for (const [playerId, incorrectGuess] of roomState.playerIncorrectGuesses.$items) {
        playerIncorrectGuesses.set(playerId, incorrectGuess);
      }
    } else {
      // Fallback for regular objects
      for (const [playerId, incorrectGuess] of Object.entries(roomState.playerIncorrectGuesses)) {
        playerIncorrectGuesses.set(playerId, incorrectGuess);
      }
    }
  }

  const chatMessages = new Map();
  if (roomState.chatMessages) {
    // Handle MapSchema properly - iterate over $items
    if (roomState.chatMessages.$items && roomState.chatMessages.$items instanceof Map) {
      for (const [messageId, message] of roomState.chatMessages.$items) {
        chatMessages.set(messageId, message);
      }
    } else {
      // Fallback for regular objects
      for (const [messageId, message] of Object.entries(roomState.chatMessages)) {
        chatMessages.set(messageId, message);
      }
    }
  }

  // Convert participatingPlayers MapSchema to Map
  const participatingPlayersMap = new Map<string, boolean>();
  if (roomState.participatingPlayers && roomState.participatingPlayers.$items) {
    for (const [key, value] of roomState.participatingPlayers.$items) {
      if (typeof value === 'boolean') {
        participatingPlayersMap.set(key, value);
      }
    }
  }

  return {
    targetScore: roomState.targetScore || 10,
    roundTime: roomState.roundTime || 30000,
    maxPlayers: roomState.maxPlayers || 8,
    isPrivate: roomState.isPrivate || false,
    gameStarted: roomState.gameStarted || false,
    gameEnded: roomState.gameEnded || false,
    gamePaused: roomState.gamePaused || false,
    canStart: roomState.canStart || false,
    currentRound: roomState.currentRound || 0,
    hostId: roomState.hostId || "",
    winnerId: roomState.winnerId || "",
    restartCountdown: roomState.restartCountdown || 0,
    participatingPlayers: participatingPlayersMap,
    roundStartTime: roomState.roundStartTime || 0,
    roundTimeRemaining: roomState.roundTimeRemaining || 0,
    roundEnded: roomState.roundEnded || false,
    correctAnswer: roomState.correctAnswer || "",
    
    // AI Question Generation Settings
    currentTopic: roomState.currentTopic || "General Knowledge",
    currentDifficulty: roomState.currentDifficulty || 5,
    
    players: playersMap,
    currentPrompt: {
      id: roomState.currentPrompt?.id || "",
      text: roomState.currentPrompt?.text || "",
      category: roomState.currentPrompt?.category || "",
      difficulty: (roomState.currentPrompt?.difficulty as "easy" | "medium" | "hard") || "easy",
      answer: roomState.currentPrompt?.answer || "",
      // Include AI-specific fields
      topic: roomState.currentPrompt?.topic || "",
      difficultyLevel: roomState.currentPrompt?.difficultyLevel || 5,
      acceptableAnswers: roomState.currentPrompt?.acceptableAnswers || []
    },
    roundGuesses,
    playerIncorrectGuesses,
    chatMessages,
  };
}

export interface UseGameConnectionReturn {
  // State
  connectionStatus: ConnectionStatus;
  gameState: GameState | null;
  currentPlayerId: string;
  gameClient: GameClient;
  
  // Room actions
  joinRoom: (params: { playerName: string; gamePin: string }) => Promise<void>;
  createRoom: (params: { topic: string; difficulty: number; isPrivate: boolean }) => Promise<void>;
  leaveRoom: () => Promise<void>;
  
  // Game actions
  sendPlayerReady: (ready: boolean) => Promise<void>;
  startGame: () => void;
  submitGuess: (guess: string) => void;
  joinNextGame: () => void;
  setTopic: (topic: string) => void;
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

  const createRoom = useCallback(async ({ topic, difficulty, isPrivate }: { topic: string; difficulty: number; isPrivate: boolean }) => {
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
    setDifficulty,
    sendChatMessage,
  };
} 