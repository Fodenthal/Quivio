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
    // Set up room state listeners
    newRoom.state.onChange = () => {
      console.log('Room state changed:', newRoom.state);
      setGameState(newRoom.state as GameState);
    };
    
    // Set initial state immediately
    if (newRoom.state) {
      console.log('Setting initial room state:', newRoom.state);
      setGameState(newRoom.state as GameState);
    }
    
    newRoom.onLeave(() => {
      console.log('Room left');
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