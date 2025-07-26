import { Client, Room } from "colyseus.js";
import { MSG, type PlayerData } from "@shared/index";

/**
 * Connection status enum for tracking client state
 */
export enum ConnectionStatus {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting", 
  CONNECTED = "connected",
  RECONNECTING = "reconnecting",
  ERROR = "error"
}

/**
 * Event handler types for game client
 */
export interface GameClientEvents {
  onConnectionStatusChange?: (status: ConnectionStatus) => void;
  onStateChange?: (state: unknown) => void;
  onPlayerJoin?: (player: PlayerData) => void;
  onPlayerLeave?: (playerId: string) => void;
  onMessage?: (type: string, message: unknown) => void;
  onError?: (error: Error) => void;
}

/**
 * Options for connecting to a room
 */
export interface JoinRoomOptions {
  playerName: string;
  gamePin?: string; // Optional - either gamePin or roomId must be provided
  roomId?: string; // Optional room ID to join specific room
  roomOptions?: {
    targetScore?: number;
    roundTime?: number;
    maxPlayers?: number;
    isPrivate?: boolean;
  };
}

/**
 * GameClient class for managing Colyseus connection and trivia room interaction
 */
export class GameClient {
  private client: Client;
  private room: Room | null = null;
  private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private events: GameClientEvents = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 1000; // Start with 1 second
  private serverHttpUrl: string; // HTTP URL for API calls

  constructor(serverUrl?: string) {
    // Default to localhost in development, can be overridden
    const url = serverUrl || (process.env.NEXT_PUBLIC_BACKEND_URL || "ws://localhost:2567");
    
    this.client = new Client(url);
    
    // Convert WebSocket URL to HTTP URL for API calls
    this.serverHttpUrl = url.replace(/^ws:/, 'http:').replace(/^wss:/, 'https:');
  }

  /**
   * Set event handlers for the game client
   */
  setEventHandlers(events: GameClientEvents): void {
    this.events = { ...this.events, ...events };
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Get current room instance
   */
  getRoom(): Room | null {
    return this.room;
  }

  /**
   * Create a new room with AI settings
   */
  async createRoom(options: {
    playerName: string;
    roomName: string;
    topics: string[];
    difficulty: number;
    isPrivate?: boolean;
    maxPlayers?: number;
  }): Promise<Room> {
    this.setConnectionStatus(ConnectionStatus.CONNECTING);
    
    try {
      const roomOptions = {
        playerName: options.playerName,
        maxPlayers: options.maxPlayers || 8,
        isPrivate: options.isPrivate || false,
        roomName: options.roomName,
        topics: options.topics,
        difficulty: options.difficulty
      };

      // Create a new room
      this.room = await this.client.create("trivia_room", roomOptions);

      this.setupRoomHandlers();
      this.setConnectionStatus(ConnectionStatus.CONNECTED);
      this.reconnectAttempts = 0; // Reset on successful connection

      return this.room;
    } catch (error) {
      this.setConnectionStatus(ConnectionStatus.ERROR);
      const gameError = new Error(`Failed to create room: ${error instanceof Error ? error.message : String(error)}`);
      this.events.onError?.(gameError);
      throw gameError;
    }
  }

  /**
   * Look up room ID by game pin using the server API
   */
  private async lookupRoomByPin(gamePin: string): Promise<string> {
    // Client-side validation first
    if (!gamePin || !/^[A-Z0-9]{5}$/.test(gamePin)) {
      console.error(`❌ Invalid game pin format: "${gamePin}" - Must be 5 alphanumeric characters`);
      throw new Error(`Invalid game pin format. Must be 5 alphanumeric characters.`);
    }

    const apiUrl = `${this.serverHttpUrl}/api/rooms/lookup/${gamePin}`;
    
    try {
      console.log(`🔍 Looking up room for game pin: ${gamePin}`);
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.error(`❌ Room not found for game pin: ${gamePin}`);
          throw new Error(`Room not found for game pin: ${gamePin}`);
        } else if (response.status === 400) {
          const errorData = await response.json();
          console.error(`❌ Invalid game pin format from server: ${gamePin} - ${errorData.error}`);
          throw new Error(`Invalid game pin format: ${errorData.error}`);
        } else {
          console.error(`❌ Server error during lookup for pin ${gamePin}: ${response.status} ${response.statusText}`);
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      console.log(`✅ Found room ${data.roomId} for game pin: ${gamePin}`);
      return data.roomId;
      
    } catch (error) {
      // Re-throw with consistent error handling
      if (error instanceof Error) {
        throw error;
      } else {
        console.error(`❌ Unexpected error during lookup for pin ${gamePin}:`, error);
        throw new Error(`Failed to lookup room: ${String(error)}`);
      }
    }
  }

  /**
   * Join a trivia room by game pin
   */
  async joinRoom(options: JoinRoomOptions): Promise<Room> {
    try {
      const roomOptions = {
        playerName: options.playerName,
        ...options.roomOptions
      };

      let roomId: string;

      if (options.roomId) {
        // If roomId is explicitly provided, use it directly
        roomId = options.roomId;
        console.log(`🚪 Joining room directly by ID: ${roomId}`);
      } else if (options.gamePin) {
        // Look up room ID by game pin (this may throw validation errors)
        roomId = await this.lookupRoomByPin(options.gamePin);
      } else {
        const error = new Error("Either roomId or gamePin must be provided");
        console.error(`❌ ${error.message}`);
        throw error;
      }

      // Only set connecting status after successful validation/lookup
      this.setConnectionStatus(ConnectionStatus.CONNECTING);

      // Join the specific room by ID
      console.log(`🚪 Joining room ${roomId} with game pin: ${options.gamePin || 'N/A'}`);
      this.room = await this.client.joinById(roomId, roomOptions);

      this.setupRoomHandlers();
      this.setConnectionStatus(ConnectionStatus.CONNECTED);
      this.reconnectAttempts = 0; // Reset on successful connection

      return this.room;
    } catch (error) {
      // Only set error status if we were in connecting state
      if (this.connectionStatus === ConnectionStatus.CONNECTING) {
        this.setConnectionStatus(ConnectionStatus.ERROR);
      }
      
      const gameError = new Error(`Failed to join room: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`❌ Join room failed:`, gameError);
      this.events.onError?.(gameError);
      throw gameError;
    }
  }

  /**
   * Leave the current room
   */
  async leaveRoom(): Promise<void> {
    if (this.room) {
      try {
        await this.room.leave();
      } catch (error) {
        console.warn("Error leaving room:", error);
      } finally {
        this.room = null;
        this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
      }
    }
  }

  /**
   * Send player ready state
   */
  sendPlayerReady(ready: boolean): void {
    this.sendMessage(MSG.PLAYER_READY, { ready });
  }

  /**
   * Submit a guess for the current round
   */
  submitGuess(guess: string): void {
    if (!guess.trim()) {
      throw new Error("Guess cannot be empty");
    }
    this.sendMessage(MSG.SUBMIT_GUESS, { guess: guess.trim() });
  }

  /**
   * Start the game (host only)
   */
  startGame(): void {
    console.log('🎮 GameClient.startGame() called - sending START_GAME message');
    this.sendMessage(MSG.START_GAME, {});
    console.log('🎮 START_GAME message sent via sendMessage()');
  }

  /**
   * Send a chat message
   */
  sendChatMessage(text: string): void {
    if (!text.trim()) {
      throw new Error("Chat message cannot be empty");
    }
    this.sendMessage(MSG.CHAT, { text: text.trim() });
  }

  /**
   * Update room settings (host only)
   */
  updateSettings(settings: {
    targetScore?: number;
    roundTime?: number;
    maxPlayers?: number;
  }): void {
    this.sendMessage(MSG.UPDATE_SETTINGS, settings);
  }

  /**
   * Join the next game (JKLM-style restart system)
   */
  joinNextGame(): void {
    this.sendMessage(MSG.JOIN_NEXT_GAME, {});
  }

  /**
   * Set the topic for AI question generation (host only)
   */
  setTopic(topic: string): void {
    if (!topic.trim()) {
      throw new Error("Topic cannot be empty");
    }
    this.sendMessage(MSG.SET_TOPIC, { topic: topic.trim() });
  }

  /**
   * Set multiple topics for AI question generation with equal rotation (host only)
   */
  setTopics(topics: string[]): void {
    if (!topics || topics.length === 0) {
      throw new Error("Topics array cannot be empty");
    }
    const validTopics = topics.filter(t => t && t.trim().length > 0).map(t => t.trim());
    if (validTopics.length === 0) {
      throw new Error("At least one valid topic is required");
    }
    this.sendMessage(MSG.SET_TOPICS, { topics: validTopics });
  }

  /**
   * Set the difficulty for AI question generation (host only)
   */
  setDifficulty(difficulty: number): void {
    if (difficulty < 1 || difficulty > 5) {
      throw new Error("Difficulty must be between 1 and 5");
    }
    this.sendMessage(MSG.SET_DIFFICULTY, { difficulty });
  }

  /**
   * Set the target score for the game (host only)
   */
  setTargetScore(score: number): void {
    if (score < 1 || score > 100) {
      throw new Error("Target score must be between 1 and 100");
    }
    this.updateSettings({ targetScore: score });
  }

  /**
   * Set the round time in seconds (host only)
   */
  setRoundTime(seconds: number): void {
    if (seconds < 10 || seconds > 600) {
      throw new Error("Round time must be between 10 and 600 seconds");
    }
    // Convert seconds to milliseconds for server
    this.updateSettings({ roundTime: seconds * 1000 });
  }

  /**
   * Set the maximum number of players (host only)
   */
  setMaxPlayers(maxPlayers: number): void {
    if (maxPlayers < 2 || maxPlayers > 20) {
      throw new Error("Max players must be between 2 and 20");
    }
    this.updateSettings({ maxPlayers });
  }

  /**
   * Generic method to send messages to the room
   */
  private sendMessage(type: string, data: unknown): void {
    if (!this.room) {
      throw new Error("Not connected to a room");
    }
    
    if (this.connectionStatus !== ConnectionStatus.CONNECTED) {
      throw new Error("Cannot send message: not connected");
    }

    try {
      this.room.send(type, data);
    } catch (error) {
      const gameError = new Error(`Failed to send message: ${error instanceof Error ? error.message : String(error)}`);
      this.events.onError?.(gameError);
      throw gameError;
    }
  }

  /**
   * Setup event handlers for the room
   */
  private setupRoomHandlers(): void {
    if (!this.room) return;

    // Handle state changes
    this.room.onStateChange((state) => {
      this.events.onStateChange?.(state);
    });

    // Handle messages
    this.room.onMessage("*", (type, message) => {
      this.events.onMessage?.(String(type), message);
    });

    // Handle disconnection
    this.room.onLeave((code) => {
      console.log(`Left room with code: ${code}`);
      this.room = null;
      
      // Handle different disconnect reasons
      if (code === 1000) {
        // Graceful disconnect (user left or server removed them)
        console.log("Gracefully disconnected from room");
        this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
      } else if (code > 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        // Unexpected disconnection, try to reconnect
        this.attemptReconnect();
      } else {
        this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
      }
    });

    // Handle errors
    this.room.onError((code, message) => {
      const error = new Error(`Room error [${String(code)}]: ${String(message)}`);
      this.events.onError?.(error);
      this.setConnectionStatus(ConnectionStatus.ERROR);
    });
  }

  /**
   * Attempt to reconnect to the room
   */
  private async attemptReconnect(): Promise<void> {
    this.setConnectionStatus(ConnectionStatus.RECONNECTING);
    this.reconnectAttempts++;

    // Exponential backoff
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(async () => {
      try {
        // Note: In a real implementation, we'd need to store the original join options
        // For now, this is a placeholder for the reconnection logic
        console.log(`Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        
        // The actual reconnection would need additional state management
        // to remember the room and player details
        
      } catch {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.setConnectionStatus(ConnectionStatus.ERROR);
          this.events.onError?.(new Error("Max reconnection attempts reached"));
        } else {
          this.attemptReconnect();
        }
      }
    }, delay);
  }

  /**
   * Update connection status and notify listeners
   */
  private setConnectionStatus(status: ConnectionStatus): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      this.events.onConnectionStatusChange?.(status);
    }
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.room) {
      try {
        this.room.leave();
      } catch (error) {
        console.warn("Error leaving room:", error);
      } finally {
        this.room = null;
        this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
      }
    }
    this.events = {};
  }
} 