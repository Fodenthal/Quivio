import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Client, Room } from 'colyseus.js';
import { GameState, PlayerData, MSG } from '@shared/index';

// Storage keys for persistence
const STORAGE_KEYS = {
  PLAYER_NAME: 'popreplay_player_name',
  ROOM_ID: 'popreplay_room_id',
  SESSION_ID: 'popreplay_session_id',
} as const;

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
  currentPlayerId: string | null;
  isLoading: boolean;
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
  const [playerName, setPlayerName] = useState(() => {
    // Initialize player name from localStorage
    return localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) || '';
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isInRoom, setIsInRoom] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const clientRef = useRef<Client | null>(null);
  const roomRef = useRef<Room | null>(null);
  const listenersSetupRef = useRef<Set<string>>(new Set());
  const lastStateUpdateRef = useRef<number>(0);
  const lastStateHashRef = useRef<string>('');
  const isReconnectingRef = useRef(false);

  // Save player name to localStorage whenever it changes
  useEffect(() => {
    if (playerName) {
      try {
        localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, playerName);
      } catch (err) {
        console.warn('Failed to save player name to localStorage:', err);
      }
    }
  }, [playerName]);

  useEffect(() => {
    // Initialize Colyseus client
    const colyseusClient = new Client('ws://localhost:2567');
    clientRef.current = colyseusClient;
    setClient(colyseusClient);

    // Try to reconnect to room if we have stored room info
    const attemptReconnection = async () => {
      const storedRoomId = localStorage.getItem(STORAGE_KEYS.ROOM_ID);
      const storedSessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
      
      if (storedRoomId && storedSessionId && playerName) {
        console.log('Attempting to reconnect to room:', storedRoomId);
        isReconnectingRef.current = true;
        
        try {
          await connectToRoom(storedRoomId);
          console.log('Successfully reconnected to room');
        } catch (err) {
          console.log('Failed to reconnect to room, clearing stored data:', err);
          // Clear stored data if reconnection fails
          localStorage.removeItem(STORAGE_KEYS.ROOM_ID);
          localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
        } finally {
          isReconnectingRef.current = false;
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    // Attempt reconnection after a short delay to ensure client is ready
    const reconnectionTimer = setTimeout(attemptReconnection, 100);

    return () => {
      clearTimeout(reconnectionTimer);
      if (roomRef.current) {
        roomRef.current.leave();
      }
    };
  }, [playerName]);

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
      
      // Save room info to localStorage
      try {
        localStorage.setItem(STORAGE_KEYS.ROOM_ID, roomId);
        localStorage.setItem(STORAGE_KEYS.SESSION_ID, newRoom.sessionId);
      } catch (err) {
        console.warn('Failed to save room info to localStorage:', err);
      }
      
    } catch (err) {
      console.error('Error joining room:', err);
      setError(`Failed to join room: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      // Clear stored data if join fails
      try {
        localStorage.removeItem(STORAGE_KEYS.ROOM_ID);
        localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
      } catch (storageErr) {
        console.warn('Failed to clear localStorage:', storageErr);
      }
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
      
      // Save room info to localStorage
      try {
        localStorage.setItem(STORAGE_KEYS.ROOM_ID, newRoom.roomId);
        localStorage.setItem(STORAGE_KEYS.SESSION_ID, newRoom.sessionId);
      } catch (err) {
        console.warn('Failed to save room info to localStorage:', err);
      }
      
    } catch (err) {
      console.error('Error creating room:', err);
      setError(`Failed to create room: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      // Clear stored data if creation fails
      try {
        localStorage.removeItem(STORAGE_KEYS.ROOM_ID);
        localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
      } catch (storageErr) {
        console.warn('Failed to clear localStorage:', storageErr);
      }
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
    
    // Set current player ID - in Colyseus, the sessionId is the player ID
    console.log('Setting current player ID:', newRoom.sessionId);
    setCurrentPlayerId(newRoom.sessionId);
    
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
      console.log('Can start:', state.canStart);
      console.log('Game started:', state.gameStarted);
      
      // Log each player's details
      if (state.players) {
        console.log('Player details:');
        state.players.forEach((player: PlayerData, id: string) => {
          console.log(`  ${id}: ${player.name} (ready: ${player.ready}, host: ${player.isHost})`);
        });
      }
      
      setGameState(state as GameState);
    });
    
    newRoom.onLeave(() => {
      console.log('Room left:', roomId);
      listenersSetupRef.current.delete(roomId);
      setRoom(null);
      roomRef.current = null;
      setIsInRoom(false);
      setGameState(null);
      setCurrentPlayerId(null);
      
      // Clear stored room data when leaving
      try {
        localStorage.removeItem(STORAGE_KEYS.ROOM_ID);
        localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
      } catch (err) {
        console.warn('Failed to clear localStorage:', err);
      }
    });

    newRoom.onError((code, message) => {
      console.error('Room error:', code, message);
      setError(`Room error: ${message}`);
      
      // Clear stored data on room error
      try {
        localStorage.removeItem(STORAGE_KEYS.ROOM_ID);
        localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
      } catch (err) {
        console.warn('Failed to clear localStorage:', err);
      }
    });
  };

  const leaveRoom = () => {
    if (room) {
      room.leave();
    }
  };

  const setReady = (ready: boolean) => {
    if (room) {
      console.log(`Sending ready message: ${ready}`);
      room.send(MSG.PLAYER_READY, { ready });
    } else {
      console.error('Cannot send ready message: no room connection');
    }
  };

  const startGame = () => {
    if (room) {
      room.send(MSG.START_GAME, {});
    }
  };

  const submitGuess = (guess: string) => {
    if (room) {
      room.send(MSG.SUBMIT_GUESS, { guess });
    }
  };

  const sendChat = (text: string) => {
    if (room) {
      room.send(MSG.CHAT, { text });
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
    currentPlayerId,
    isLoading,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}; 