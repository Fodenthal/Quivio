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
  gamePin: string;
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

  constructor(serverUrl?: string) {
    // Default to localhost in development, can be overridden
    const url = serverUrl || (process.env.NODE_ENV === "production" ? 
      "wss://your-production-url.com" : 
      "ws://localhost:2567");
    
    this.client = new Client(url);
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
    topic: string;
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
        topic: options.topic,
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
   * Join or create a trivia room
   */
  async joinRoom(options: JoinRoomOptions): Promise<Room> {
    this.setConnectionStatus(ConnectionStatus.CONNECTING);
    
    try {
      const roomOptions = {
        playerName: options.playerName,
        ...options.roomOptions
      };

      // Join specific room or create/join any available room
      this.room = options.roomId 
        ? await this.client.joinById(options.roomId, roomOptions)
        : await this.client.joinOrCreate("trivia_room", roomOptions);

      this.setupRoomHandlers();
      this.setConnectionStatus(ConnectionStatus.CONNECTED);
      this.reconnectAttempts = 0; // Reset on successful connection

      return this.room;
    } catch (error) {
      this.setConnectionStatus(ConnectionStatus.ERROR);
      const gameError = new Error(`Failed to join room: ${error instanceof Error ? error.message : String(error)}`);
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
    this.sendMessage(MSG.START_GAME, {});
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
   * Set the difficulty for AI question generation (host only)
   */
  setDifficulty(difficulty: number): void {
    if (difficulty < 1 || difficulty > 10) {
      throw new Error("Difficulty must be between 1 and 10");
    }
    this.sendMessage(MSG.SET_DIFFICULTY, { difficulty });
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