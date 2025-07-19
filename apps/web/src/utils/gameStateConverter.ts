"use client";

import { GameState, PlayerData } from "@shared/index";

// Type for Colyseus MapSchema internal structure
export interface MapSchemaLike {
  $items?: Map<string, unknown>;
  $indexes?: Map<string, unknown>;
  deletedItems?: unknown;
  [key: string]: unknown;
}

// Type for the raw Colyseus room state as received by the client
export interface RawRoomState {
  targetScore?: number;
  roundTime?: number;
  maxPlayers?: number;
  isPrivate?: boolean;
  gamePin?: string;
  roomName?: string;
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
  topics?: string[];
  currentTopic?: string;
  currentTopicIndex?: number;
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
export function convertColyseusState(state: unknown): GameState | null {
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
    gamePin: roomState.gamePin || "",
    roomName: roomState.roomName || "Trivia Room",
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
    topics: roomState.topics || [],
    currentTopic: roomState.currentTopic || "",
    currentTopicIndex: roomState.currentTopicIndex || 0,
    currentDifficulty: roomState.currentDifficulty || 3,
    
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
