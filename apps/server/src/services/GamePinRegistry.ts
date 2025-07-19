/**
 * GamePinRegistry - Singleton service for managing game pin to room ID mappings
 * Handles room registration, lookup, and cleanup for the trivia game system
 */

/**
 * Metadata about an active room that can be displayed to users
 */
export interface RoomMetadata {
  gamePin: string;
  roomId: string;
  topic: string;
  difficulty: number;
  playerCount: number;
  maxPlayers: number;
  isPrivate: boolean;
  gameStarted: boolean;
  canStart: boolean;
  createdAt: number;
}

export class GamePinRegistry {
  private static instance: GamePinRegistry;
  private pinToRoomId = new Map<string, string>();
  private roomIdToPin = new Map<string, string>();
  private roomMetadata = new Map<string, RoomMetadata>(); // roomId -> metadata

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get the singleton instance of GamePinRegistry
   */
  static getInstance(): GamePinRegistry {
    if (!GamePinRegistry.instance) {
      GamePinRegistry.instance = new GamePinRegistry();
    }
    return GamePinRegistry.instance;
  }

  /**
   * Register a room with its game pin and initial metadata
   * @param gamePin - The 5-character game pin
   * @param roomId - The Colyseus room ID
   * @param metadata - Initial room metadata (optional for backward compatibility)
   * @returns true if registered successfully, false if pin already exists
   */
  registerRoom(gamePin: string, roomId: string, metadata?: Partial<RoomMetadata>): boolean {
    if (this.pinToRoomId.has(gamePin)) {
      console.warn(`⚠️ Game pin collision detected: ${gamePin} already exists`);
      return false;
    }

    // Remove any existing mapping for this room ID (in case of re-registration)
    this.removeRoomById(roomId);

    this.pinToRoomId.set(gamePin, roomId);
    this.roomIdToPin.set(roomId, gamePin);
    
    // Store metadata if provided
    if (metadata) {
      const fullMetadata: RoomMetadata = {
        gamePin,
        roomId,
        topic: metadata.topic || "General Knowledge",
        difficulty: metadata.difficulty || 5,
        playerCount: metadata.playerCount || 0,
        maxPlayers: metadata.maxPlayers || 8,
        isPrivate: metadata.isPrivate || false,
        gameStarted: metadata.gameStarted || false,
        canStart: metadata.canStart || false,
        createdAt: Date.now()
      };
      this.roomMetadata.set(roomId, fullMetadata);
    }
    
    console.log(`📌 Registered room ${roomId} with game pin: ${gamePin} (Total rooms: ${this.pinToRoomId.size})`);
    return true;
  }

  /**
   * Update room metadata for an existing room
   * @param roomId - The room ID to update
   * @param updates - Partial metadata updates
   * @returns true if updated successfully, false if room not found
   */
  updateRoomMetadata(roomId: string, updates: Partial<Omit<RoomMetadata, 'gamePin' | 'roomId' | 'createdAt'>>): boolean {
    const existingMetadata = this.roomMetadata.get(roomId);
    if (!existingMetadata) {
      return false;
    }

    // Merge updates with existing metadata
    const updatedMetadata: RoomMetadata = {
      ...existingMetadata,
      ...updates
    };

    this.roomMetadata.set(roomId, updatedMetadata);
    return true;
  }

  /**
   * Look up room ID by game pin
   * @param gamePin - The game pin to search for
   * @returns Room ID if found, null if not found
   */
  lookupRoom(gamePin: string): string | null {
    const roomId = this.pinToRoomId.get(gamePin) || null;
    console.log(`🔍 Lookup for pin ${gamePin}: ${roomId ? `Found room ${roomId}` : 'Not found'}`);
    return roomId;
  }

  /**
   * Remove a room by its game pin
   * @param gamePin - The game pin to remove
   * @returns true if removed, false if not found
   */
  removeRoom(gamePin: string): boolean {
    const roomId = this.pinToRoomId.get(gamePin);
    if (!roomId) {
      return false;
    }

    this.pinToRoomId.delete(gamePin);
    this.roomIdToPin.delete(roomId);
    this.roomMetadata.delete(roomId); // Clean up metadata
    
    console.log(`🗑️ Removed room ${roomId} with pin ${gamePin} (Remaining rooms: ${this.pinToRoomId.size})`);
    return true;
  }

  /**
   * Remove a room by its room ID
   * @param roomId - The room ID to remove
   * @returns true if removed, false if not found
   */
  removeRoomById(roomId: string): boolean {
    const gamePin = this.roomIdToPin.get(roomId);
    if (!gamePin) {
      return false;
    }

    return this.removeRoom(gamePin);
  }

  /**
   * Check if a game pin is already in use
   * @param gamePin - The game pin to check
   * @returns true if pin exists, false otherwise
   */
  isPinInUse(gamePin: string): boolean {
    return this.pinToRoomId.has(gamePin);
  }

  /**
   * Get all active rooms (public rooms only) with metadata
   * @returns Array of RoomMetadata objects for all public rooms (including full ones)
   */
  listAvailableRooms(): RoomMetadata[] {
    const rooms: RoomMetadata[] = [];
    
    for (const [roomId, metadata] of this.roomMetadata) {
      // Only include public rooms (show all, including full rooms)
      if (!metadata.isPrivate) {
        rooms.push(metadata);
      }
    }
    
    // Sort by creation time (newest first) and then by player count
    return rooms.sort((a, b) => {
      // First sort by whether game has started (lobby rooms first)
      if (a.gameStarted !== b.gameStarted) {
        return a.gameStarted ? 1 : -1;
      }
      // Then by player count (more players first)
      if (a.playerCount !== b.playerCount) {
        return b.playerCount - a.playerCount;
      }
      // Finally by creation time (newest first)
      return b.createdAt - a.createdAt;
    });
  }

  /**
   * Get metadata for a specific room
   * @param roomId - The room ID to get metadata for
   * @returns RoomMetadata if found, null otherwise
   */
  getRoomMetadata(roomId: string): RoomMetadata | null {
    return this.roomMetadata.get(roomId) || null;
  }

  /**
   * Get current registry statistics
   * @returns Object with registry stats
   */
  getStats(): {totalRooms: number; publicRooms: number; pins: string[]} {
    const publicRooms = Array.from(this.roomMetadata.values()).filter(room => !room.isPrivate).length;
    return {
      totalRooms: this.pinToRoomId.size,
      publicRooms,
      pins: Array.from(this.pinToRoomId.keys())
    };
  }

  /**
   * Clear all registrations (primarily for testing)
   */
  clear(): void {
    this.pinToRoomId.clear();
    this.roomIdToPin.clear();
    this.roomMetadata.clear();
    console.log("🧹 GamePinRegistry cleared");
  }
} 