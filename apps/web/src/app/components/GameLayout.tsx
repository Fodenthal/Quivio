"use client";

import { useState, useEffect } from "react";
import { GameClient, ConnectionStatus } from "@/lib/gameClient";
import { GameLobby } from "./GameLobby";
import { GameView } from "./GameView";
import { GamePins } from "./GamePins";
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
  players?: MapSchemaLike | Record<string, PlayerData>;
  currentPrompt?: {
    id?: string;
    text?: string;
    category?: string;
    difficulty?: string;
    answer?: string;
  };
  roundGuesses?: MapSchemaLike | Record<string, unknown>;
  playerIncorrectGuesses?: MapSchemaLike | Record<string, unknown>;
  chatMessages?: MapSchemaLike | Record<string, unknown>;
}

export function GameLayout() {
  const [gameClient] = useState(() => new GameClient());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED
  );
  const [playerName, setPlayerName] = useState("");
  const [gamePin, setGamePin] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>("");

  useEffect(() => {
    // Set up event handlers for connection status changes
    gameClient.setEventHandlers({
      onConnectionStatusChange: (status) => {
        setConnectionStatus(status);
        // Clear game state when disconnected to ensure clean return to join form
        if (status === ConnectionStatus.DISCONNECTED) {
          setGameState(null);
          setCurrentPlayerId("");
        }
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
            for (const [messageId, message] of Object.entries(roomState.chatMessages)) {
              chatMessages.set(messageId, message);
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
            restartCountdown: roomState.restartCountdown || 0,
            participatingPlayers: participatingPlayersMap,
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
            playerIncorrectGuesses,
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
    if (!gamePin.trim()) {
      alert("Please enter a game pin");
      return;
    }

    setIsJoining(true);
    try {
      await gameClient.joinRoom({
        playerName: playerName.trim(),
        gamePin: gamePin.trim(),
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

  const handleSubmitGuess = async (guess: string) => {
    try {
      gameClient.submitGuess(guess);
    } catch (error) {
      console.error("Failed to submit guess:", error);
      throw error; // Re-throw so GameView can handle it
    }
  };

  const handleJoinNextGame = () => {
    try {
      gameClient.joinNextGame();
    } catch (error) {
      console.error("Failed to join next game:", error);
    }
  };

  const handleLeaveGame = async () => {
    try {
      await gameClient.leaveRoom();
      // Reset local state
      setGameState(null);
      setCurrentPlayerId("");
      setPlayerName("");
    } catch (error) {
      console.error("Failed to leave game:", error);
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
        <div className="flex items-start justify-center min-h-[calc(100vh-80px)] p-4 pt-6">
          <div className="flex items-start gap-6 w-full max-w-4xl">
            {/* Join Form - 3/3 size */}
            <div className="flex-[3]">
              <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-glass p-6 border border-white/20 w-full max-w-md text-center">
                <div className="space-y-4">
                  <div>
                    <input
                      id="playerName"
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full px-4 py-3 text-center text-xl bg-white/20 border border-white/30 rounded-lg text-text-main placeholder-text-secondary focus:outline-none focus:ring-4 focus:ring-primary focus:ring-opacity-50 transition-all duration-300"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !isJoining) {
                          handleJoinRoom();
                        }
                      }}
                    />
                  </div>
                  <div>
                    <input
                      id="gamePin"
                      type="text"
                      value={gamePin}
                      onChange={(e) => setGamePin(e.target.value)}
                      placeholder="Game PIN"
                      className="w-full px-4 py-3 text-center text-xl bg-white/20 border border-white/30 rounded-lg text-text-main placeholder-text-secondary focus:outline-none focus:ring-4 focus:ring-primary focus:ring-opacity-50 transition-all duration-300"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !isJoining) {
                          handleJoinRoom();
                        }
                      }}
                    />
                  </div>
                  <button
                    onClick={handleJoinRoom}
                    disabled={isJoining || !playerName.trim() || !gamePin.trim()}
                    className="w-full px-4 py-3 bg-primary text-white font-bold text-xl rounded-lg hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {isJoining ? "Joining..." : "Enter"}
                  </button>
                </div>
              </div>
            </div>
            
            {/* GamePins Component - 2/3 size */}
            <div className="flex-[2] h-[500px]">
              <GamePins />
            </div>
          </div>
        </div>
      );
    }

    if (connectionStatus === ConnectionStatus.CONNECTED && gameState) {
      if (!gameState.gameStarted && !gameState.gameEnded) {
        // Show lobby when connected but game hasn't started and hasn't ended
        return (
          <GameLobby
            gameState={gameState}
            currentPlayerId={currentPlayerId}
            onPlayerReady={handlePlayerReady}
            onStartGame={handleStartGame}
          />
        );
      } else {
        // Show game interface when game has started OR when game has ended (for winner screen)
        return (
          <GameView
            gameState={gameState}
            currentPlayerId={currentPlayerId}
            onSubmitGuess={handleSubmitGuess}
            onJoinNextGame={handleJoinNextGame}
          />
        );
      }
    }

    // Show loading/connecting state
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-glass p-8 border border-white/20">
        <h2 className="text-3xl font-bold text-text-main mb-4 text-center">
          Connecting...
        </h2>
        <p className="text-text-secondary text-center">
          Please wait while we connect you to the game.
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Header with connection status */}
      <header className="bg-white/5 backdrop-blur-xl shadow-glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <h1 className="text-3xl font-bold text-primary">PopReplay</h1>
            
            <div className="flex items-center space-x-4">
              {/* Leave Game Button - shown when connected */}
              {connectionStatus === ConnectionStatus.CONNECTED && (
                <button
                  onClick={handleLeaveGame}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-main hover:bg-white/10 rounded-md transition-colors"
                >
                  Leave Game
                </button>
              )}
              
              {/* Connection Status Indicator */}
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${getStatusColor(connectionStatus)}`}
                />
                <span className="text-sm font-medium text-text-secondary">
                  {getStatusText(connectionStatus)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {renderMainContent()}
      </main>
    </div>
  );
}