import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Client, Room } from 'colyseus.js';
import { GameState } from '@shared/index';

interface GameContextType {
  client: Client | null;
  room: Room | null;
  gameState: GameState | null;
  playerName: string;
  setPlayerName: (name: string) => void;
  connectToRoom: (roomId: string) => Promise<void>;
  createRoom: () => Promise<void>;
  leaveRoom: () => void;
  setReady: (ready: boolean) => void;
  startGame: () => void;
  submitGuess: (guess: string) => void;
  sendChat: (text: string) => void;
  isConnected: boolean;
  isInRoom: boolean;
  error: string | null;
  clearError: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: React.ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isInRoom, setIsInRoom] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const clientRef = useRef<Client | null>(null);
  const roomRef = useRef<Room | null>(null);
  const listenersSetupRef = useRef<Set<string>>(new Set());
  const lastStateUpdateRef = useRef<number>(0);
  const lastStateHashRef = useRef<string>('');

  useEffect(() => {
    // Initialize Colyseus client
    const colyseusClient = new Client('ws://localhost:2567');
    clientRef.current = colyseusClient;
    setClient(colyseusClient);

    return () => {
      if (roomRef.current) {
        roomRef.current.leave();
      }
    };
  }, []);

  const clearError = () => setError(null);

  const connectToRoom = async (roomId: string) => {
    if (!clientRef.current || !playerName.trim()) {
      setError('Please enter a player name');
      return;
    }

    // Prevent duplicate room connections
    if (roomRef.current) {
      console.log('Already in a room, leaving first');
      roomRef.current.leave();
    }

    try {
      setError(null);
      console.log('Joining room:', roomId);
      
      const newRoom = await clientRef.current.joinById(roomId, {
        playerName: playerName
      });
      
      console.log('Room joined:', newRoom);
      setupRoomListeners(newRoom);
      setRoom(newRoom);
      roomRef.current = newRoom;
      setIsConnected(true);
      setIsInRoom(true);
      
    } catch (err) {
      console.error('Error joining room:', err);
      setError(`Failed to join room: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const createRoom = async () => {
    if (!clientRef.current || !playerName.trim()) {
      setError('Please enter a player name');
      return;
    }

    // Prevent duplicate room creation
    if (roomRef.current) {
      console.log('Already in a room, leaving first');
      roomRef.current.leave();
    }

    try {
      setError(null);
      console.log('Creating room...');
      
      const newRoom = await clientRef.current.create('trivia_room', {
        playerName: playerName
      });
      
      console.log('Room created:', newRoom);
      setupRoomListeners(newRoom);
      setRoom(newRoom);
      roomRef.current = newRoom;
      setIsConnected(true);
      setIsInRoom(true);
      
    } catch (err) {
      console.error('Error creating room:', err);
      setError(`Failed to create room: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const setupRoomListeners = (newRoom: Room) => {
    const roomId = newRoom.sessionId;
    
    // Prevent duplicate listeners for the same room
    if (listenersSetupRef.current.has(roomId)) {
      console.log('Listeners already set up for room:', roomId);
      return;
    }
    
    console.log('Setting up room listeners for room:', roomId);
    listenersSetupRef.current.add(roomId);
    
    // Wait for state to be available before setting up listeners
    newRoom.onStateChange((state) => {
      const now = Date.now();
      
      // Create a simple hash of the state to detect duplicates
      const stateHash = JSON.stringify({
        playersSize: state.players?.size,
        gameStarted: state.gameStarted,
        currentRound: state.currentRound,
        targetScore: state.targetScore,
        roundTime: state.roundTime,
        hostId: state.hostId
      });
      
      // Reduce debounce time to 50ms for more responsive updates
      if (now - lastStateUpdateRef.current < 50 && stateHash === lastStateHashRef.current) {
        console.log('Skipping duplicate state update for room:', roomId);
        return;
      }
      
      lastStateUpdateRef.current = now;
      lastStateHashRef.current = stateHash;
      
      console.log('Room state synchronized for room:', roomId, state);
      console.log('Players:', state.players);
      console.log('Players size:', state.players?.size);
      console.log('Host ID:', state.hostId);
      console.log('Target score:', state.targetScore);
      console.log('Round time:', state.roundTime);
      setGameState(state as GameState);
    });
    
    newRoom.onLeave(() => {
      console.log('Room left:', roomId);
      listenersSetupRef.current.delete(roomId);
      setRoom(null);
      roomRef.current = null;
      setIsInRoom(false);
      setGameState(null);
    });

    newRoom.onError((code, message) => {
      console.error('Room error:', code, message);
      setError(`Room error: ${message}`);
    });
  };

  const leaveRoom = () => {
    if (room) {
      room.leave();
    }
  };

  const setReady = (ready: boolean) => {
    if (room) {
      room.send('player_ready', { ready });
    }
  };

  const startGame = () => {
    if (room) {
      room.send('start_game', {});
    }
  };

  const submitGuess = (guess: string) => {
    if (room) {
      room.send('submit_guess', { guess });
    }
  };

  const sendChat = (text: string) => {
    if (room) {
      room.send('chat', { text });
    }
  };

  const value: GameContextType = {
    client,
    room,
    gameState,
    playerName,
    setPlayerName,
    connectToRoom,
    createRoom,
    leaveRoom,
    setReady,
    startGame,
    submitGuess,
    sendChat,
    isConnected,
    isInRoom,
    error,
    clearError,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}; 