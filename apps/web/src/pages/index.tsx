import { useState, useEffect, useRef } from "react";
import { Client, Room } from "colyseus.js";

interface PlayerData {
  id: string;
  name: string;
  score: number;
  ready: boolean;
  isHost: boolean;
  joinedAt: number;
}

interface GameState {
  targetScore: number;
  roundTime: number;
  maxPlayers: number;
  isPrivate: boolean;
  gameStarted: boolean;
  gameEnded: boolean;
  gamePaused: boolean;
  canStart: boolean;
  currentRound: number;
  hostId: string;
  winnerId: string;
  roundStartTime: number;
  roundTimeRemaining: number;
  roundEnded: boolean;
  correctAnswer: string;
  players: Map<string, PlayerData>;
  currentPrompt: {
    id: string;
    text: string;
    category: string;
    difficulty: string;
  };
  roundGuesses: Map<string, any>;
  chatMessages: Map<string, any>;
}

interface LocalGameState {
  connected: boolean;
  inRoom: boolean;
  roomId?: string;
  playerName: string;
  gameState?: GameState;
  error?: string;
}

export default function Home() {
  const [gameState, setGameState] = useState<LocalGameState>({
    connected: false,
    inRoom: false,
    playerName: "",
  });
  
  const clientRef = useRef<Client>();
  const roomRef = useRef<Room>();

  useEffect(() => {
    // Initialize Colyseus client
    const client = new Client("ws://localhost:2567");
    clientRef.current = client;
    
    return () => {
      if (roomRef.current) {
        roomRef.current.leave();
      }
    };
  }, []);

  const connectToRoom = async (roomId: string) => {
    if (!clientRef.current || !gameState.playerName.trim()) {
      setGameState(prev => ({ ...prev, error: "Please enter a player name" }));
      return;
    }

    try {
      setGameState(prev => ({ ...prev, error: undefined }));
      
      const room = await clientRef.current.joinById(roomId, {
        playerName: gameState.playerName
      });
      
      roomRef.current = room;
      
      // Set up room state listeners
      room.state.onChange = () => {
        setGameState(prev => ({ ...prev, gameState: room.state as any }));
      };
      
      room.onLeave(() => {
        setGameState(prev => ({ 
          ...prev, 
          inRoom: false, 
          roomId: undefined,
          gameState: undefined 
        }));
      });
      
      setGameState(prev => ({ 
        ...prev, 
        connected: true, 
        inRoom: true, 
        roomId 
      }));
      
    } catch (error) {
      setGameState(prev => ({ 
        ...prev, 
        error: `Failed to join room: ${error}` 
      }));
    }
  };

  const createRoom = async () => {
    if (!clientRef.current || !gameState.playerName.trim()) {
      setGameState(prev => ({ ...prev, error: "Please enter a player name" }));
      return;
    }

    try {
      setGameState(prev => ({ ...prev, error: undefined }));
      
      const room = await clientRef.current.create("trivia_room", {
        playerName: gameState.playerName
      });
      
      roomRef.current = room;
      
      // Set up room state listeners
      room.state.onChange = () => {
        setGameState(prev => ({ ...prev, gameState: room.state as any }));
      };
      
      room.onLeave(() => {
        setGameState(prev => ({ 
          ...prev, 
          inRoom: false, 
          roomId: undefined,
          gameState: undefined 
        }));
      });
      
      setGameState(prev => ({ 
        ...prev, 
        connected: true, 
        inRoom: true, 
        roomId: room.id 
      }));
      
    } catch (error) {
      setGameState(prev => ({ 
        ...prev, 
        error: `Failed to create room: ${error}` 
      }));
    }
  };

  const setReady = (ready: boolean) => {
    if (roomRef.current) {
      roomRef.current.send("player_ready", { ready });
    }
  };

  const startGame = () => {
    if (roomRef.current) {
      roomRef.current.send("start_game", {});
    }
  };

  const submitGuess = (guess: string) => {
    if (roomRef.current) {
      roomRef.current.send("submit_guess", { guess });
    }
  };

  const sendChat = (text: string) => {
    if (roomRef.current) {
      roomRef.current.send("chat", { text });
    }
  };

  const leaveRoom = () => {
    if (roomRef.current) {
      roomRef.current.leave();
    }
  };

  if (!gameState.inRoom) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-6">PopReplay</h1>
          
          {gameState.error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {gameState.error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Player Name
              </label>
              <input
                type="text"
                value={gameState.playerName}
                onChange={(e) => setGameState(prev => ({ ...prev, playerName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your name"
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={createRoom}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
              >
                Create Room
              </button>
              <button
                onClick={() => {
                  const roomId = prompt("Enter room ID:");
                  if (roomId) connectToRoom(roomId);
                }}
                className="flex-1 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">PopReplay</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Room: {gameState.roomId}
              </span>
              <button
                onClick={leaveRoom}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
              >
                Leave Room
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Game Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Game Status */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-4">Game Status</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Status: </span>
                  <span className={gameState.gameState?.gameStarted ? "text-green-600" : "text-yellow-600"}>
                    {gameState.gameState?.gameStarted ? "Playing" : "Waiting"}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Round: </span>
                  <span>{gameState.gameState?.currentRound || 0}</span>
                </div>
                <div>
                  <span className="font-medium">Time Left: </span>
                  <span>{Math.ceil((gameState.gameState?.roundTimeRemaining || 0) / 1000)}s</span>
                </div>
                <div>
                  <span className="font-medium">Target Score: </span>
                  <span>{gameState.gameState?.targetScore || 10}</span>
                </div>
              </div>
            </div>

            {/* Current Prompt */}
            {gameState.gameState?.gameStarted && gameState.gameState.currentPrompt?.text && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Current Prompt</h2>
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-lg">{gameState.gameState.currentPrompt.text}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    Category: {gameState.gameState.currentPrompt.category} | 
                    Difficulty: {gameState.gameState.currentPrompt.difficulty}
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter your guess..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.currentTarget as HTMLInputElement;
                        submitGuess(input.value);
                        input.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Enter your guess..."]') as HTMLInputElement;
                      if (input?.value) {
                        submitGuess(input.value);
                        input.value = '';
                      }
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}

            {/* Game Controls */}
            {!gameState.gameState?.gameStarted && (
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-xl font-semibold mb-4">Game Controls</h2>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setReady(true)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                  >
                    Ready
                  </button>
                  <button
                    onClick={() => setReady(false)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors"
                  >
                    Not Ready
                  </button>
                  {gameState.gameState?.canStart && (
                    <button
                      onClick={startGame}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                    >
                      Start Game
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Players */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-4">Players ({gameState.gameState?.players?.size || 0})</h2>
              <div className="space-y-2">
                {gameState.gameState?.players && Array.from(gameState.gameState.players.values()).map((player: PlayerData) => (
                  <div key={player.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{player.name}</span>
                      {player.isHost && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded ml-2">Host</span>}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{player.score} pts</div>
                      <div className={`text-xs ${player.ready ? 'text-green-600' : 'text-gray-500'}`}>
                        {player.ready ? 'Ready' : 'Not Ready'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-4">Chat</h2>
              <div className="h-64 overflow-y-auto mb-4 space-y-2">
                {gameState.gameState?.chatMessages && Array.from(gameState.gameState.chatMessages.values()).map((message: any, index: number) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">{message.playerId?.slice(0, 6)}: </span>
                    <span>{message.text}</span>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.currentTarget as HTMLInputElement;
                      sendChat(input.value);
                      input.value = '';
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Type a message..."]') as HTMLInputElement;
                    if (input?.value) {
                      sendChat(input.value);
                      input.value = '';
                    }
                  }}
                  className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
