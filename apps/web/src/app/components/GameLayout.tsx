"use client";

import { useState, useEffect } from "react";
import { GameClient, ConnectionStatus } from "@/lib/gameClient";
import { GameLobby } from "./GameLobby";
import { GameState, PlayerData } from "@shared/index";

interface GameLayoutProps {
  children?: React.ReactNode;
}

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
  roundStartTime?: number;
  roundTimeRemaining?: number;
  roundEnded?: boolean;
  correctAnswer?: string;
  players?: MapSchemaLike | Record<string, PlayerData>;
  currentPrompt?: {
    id?: string;
    text?: string;
    category?: string;
    difficulty?: string;
    answer?: string;
  };
  roundGuesses?: MapSchemaLike | Record<string, unknown>;
  chatMessages?: MapSchemaLike | Record<string, unknown>;
}

export function GameLayout({ children }: GameLayoutProps) {
  const [gameClient] = useState(() => new GameClient());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED
  );
  const [playerName, setPlayerName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>("");

  useEffect(() => {
    // Set up event handlers for connection status changes
    gameClient.setEventHandlers({
      onConnectionStatusChange: (status) => {
        setConnectionStatus(status);
      },
      onStateChange: (state) => {
        // Convert the Colyseus room state to our GameState interface
        if (state && typeof state === 'object') {
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
          
          console.log('Final playersMap size:', playersMap.size);
          console.log('Final playersMap entries:', Array.from(playersMap.entries()));

          // Convert other MapSchemas to Maps as needed
          const roundGuesses = new Map();
          if (roomState.roundGuesses) {
            for (const [playerId, guess] of Object.entries(roomState.roundGuesses)) {
              roundGuesses.set(playerId, guess);
            }
          }

          const chatMessages = new Map();
          if (roomState.chatMessages) {
            for (const [messageId, message] of Object.entries(roomState.chatMessages)) {
              chatMessages.set(messageId, message);
            }
          }

          const convertedState: GameState = {
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
            roundStartTime: roomState.roundStartTime || 0,
            roundTimeRemaining: roomState.roundTimeRemaining || 0,
            roundEnded: roomState.roundEnded || false,
            correctAnswer: roomState.correctAnswer || "",
            players: playersMap,
            currentPrompt: {
              id: roomState.currentPrompt?.id || "",
              text: roomState.currentPrompt?.text || "",
              category: roomState.currentPrompt?.category || "",
              difficulty: (roomState.currentPrompt?.difficulty as "easy" | "medium" | "hard") || "easy",
              answer: roomState.currentPrompt?.answer || ""
            },
            roundGuesses,
            chatMessages,
          };

          setGameState(convertedState);
        }
      },
      onError: (error) => {
        console.error("Game client error:", error);
        setIsJoining(false);
      },
    });

    // Cleanup on unmount
    return () => {
      gameClient.dispose();
    };
  }, [gameClient]);

  // Get current player ID from the room
  useEffect(() => {
    const room = gameClient.getRoom();
    if (room && room.sessionId) {
      setCurrentPlayerId(room.sessionId);
    }
  }, [gameClient, connectionStatus]);

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      alert("Please enter your name");
      return;
    }

    setIsJoining(true);
    try {
      await gameClient.joinRoom({
        playerName: playerName.trim(),
      });
    } catch (error) {
      console.error("Failed to join room:", error);
      alert("Failed to join room. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const handlePlayerReady = async (ready: boolean) => {
    try {
      gameClient.sendPlayerReady(ready);
    } catch (error) {
      console.error("Failed to update ready state:", error);
      throw error; // Re-throw so GameLobby can handle it
    }
  };

  const handleStartGame = () => {
    try {
      gameClient.startGame();
    } catch (error) {
      console.error("Failed to start game:", error);
      alert("Failed to start game. Please try again.");
    }
  };

  const getStatusColor = (status: ConnectionStatus) => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return "bg-green-500";
      case ConnectionStatus.CONNECTING:
      case ConnectionStatus.RECONNECTING:
        return "bg-yellow-500";
      case ConnectionStatus.ERROR:
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: ConnectionStatus) => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return "Connected";
      case ConnectionStatus.CONNECTING:
        return "Connecting...";
      case ConnectionStatus.RECONNECTING:
        return "Reconnecting...";
      case ConnectionStatus.ERROR:
        return "Connection Error";
      default:
        return "Disconnected";
    }
  };

  // Determine which view to show
  const renderMainContent = () => {
    if (connectionStatus === ConnectionStatus.DISCONNECTED) {
      // Show join form when disconnected
      return (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Join Game
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isJoining) {
                    handleJoinRoom();
                  }
                }}
              />
            </div>
            <button
              onClick={handleJoinRoom}
              disabled={isJoining || !playerName.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isJoining ? "Joining..." : "Join Game"}
            </button>
          </div>
        </div>
      );
    }

    if (connectionStatus === ConnectionStatus.CONNECTED && gameState) {
      if (!gameState.gameStarted) {
        // Show lobby when connected but game hasn't started
        return (
          <GameLobby
            gameState={gameState}
            currentPlayerId={currentPlayerId}
            onPlayerReady={handlePlayerReady}
            onStartGame={handleStartGame}
          />
        );
      } else {
        // Show game interface when game has started
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Game Interface
            </h2>
            <p className="text-gray-600">
              Game is now in progress! Game interface will be implemented in the next phase.
            </p>
            {children}
          </div>
        );
      }
    }

    // Show loading/connecting state
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Connecting...
        </h2>
        <p className="text-gray-600">
          Please wait while we connect you to the game.
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with connection status */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">PopReplay</h1>
            
            {/* Connection Status Indicator */}
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${getStatusColor(connectionStatus)}`}
              />
              <span className="text-sm font-medium text-gray-700">
                {getStatusText(connectionStatus)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {renderMainContent()}
      </main>
    </div>
  );
} 