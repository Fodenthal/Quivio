/**
 * GamePinRegistry - Singleton service for managing game pin to room ID mappings
 * Handles room registration, lookup, and cleanup for the trivia game system
 */
export class GamePinRegistry {
  private static instance: GamePinRegistry;
  private pinToRoomId = new Map<string, string>();
  private roomIdToPin = new Map<string, string>();

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
   * Register a room with its game pin
   * @param gamePin - The 5-character game pin
   * @param roomId - The Colyseus room ID
   * @returns true if registered successfully, false if pin already exists
   */
  registerRoom(gamePin: string, roomId: string): boolean {
    if (this.pinToRoomId.has(gamePin)) {
      console.warn(`⚠️ Game pin collision detected: ${gamePin} already exists`);
      return false;
    }

    // Remove any existing mapping for this room ID (in case of re-registration)
    this.removeRoomById(roomId);

    this.pinToRoomId.set(gamePin, roomId);
    this.roomIdToPin.set(roomId, gamePin);
    
    console.log(`📌 Registered room ${roomId} with game pin: ${gamePin} (Total rooms: ${this.pinToRoomId.size})`);
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
   * Get all available rooms (public rooms only)
   * @returns Array of {gamePin, roomId} objects for public rooms
   */
  listAvailableRooms(): Array<{gamePin: string; roomId: string}> {
    const rooms: Array<{gamePin: string; roomId: string}> = [];
    for (const [gamePin, roomId] of this.pinToRoomId) {
      rooms.push({ gamePin, roomId });
    }
    return rooms;
  }

  /**
   * Get current registry statistics
   * @returns Object with registry stats
   */
  getStats(): {totalRooms: number; pins: string[]} {
    return {
      totalRooms: this.pinToRoomId.size,
      pins: Array.from(this.pinToRoomId.keys())
    };
  }

  /**
   * Clear all registrations (primarily for testing)
   */
  clear(): void {
    this.pinToRoomId.clear();
    this.roomIdToPin.clear();
    console.log("🧹 GamePinRegistry cleared");
  }
} 