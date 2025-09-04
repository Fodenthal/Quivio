import { MSG, ClockSyncMessage } from "@shared/index";

/**
 * Manages client-server clock synchronization for accurate timer calculations.
 * Uses ping/pong mechanism to measure and compensate for network latency and clock drift.
 */
export class ClockSyncManager {
  private serverTimeOffset: number = 0; // Server time - client time
  private lastSyncTime: number = 0;
  private syncInProgress: boolean = false;
  private gameClient: any = null; // Will be injected
  private readonly SYNC_INTERVAL = 30000; // Re-sync every 30 seconds
  private readonly SYNC_TIMEOUT = 5000; // Timeout sync requests after 5s
  private syncTimer?: NodeJS.Timeout;

  /**
   * Initialize the clock sync manager with a game client reference
   * @param gameClient - The game client instance for sending messages
   */
  initialize(gameClient: any): void {
    this.gameClient = gameClient;
    this.startPeriodicSync();
  }

  /**
   * Perform initial clock synchronization
   * @returns Promise that resolves when sync is complete
   */
  async performInitialSync(): Promise<void> {
    if (!this.gameClient) {
      throw new Error("ClockSyncManager not initialized with game client");
    }

    return this.performSync();
  }

  /**
   * Get the current timestamp synchronized with server time
   * @returns Server-synchronized timestamp in milliseconds
   */
  getSyncedTimestamp(): number {
    return Date.now() + this.serverTimeOffset;
  }

  /**
   * Get the current time offset between server and client
   * @returns Time offset in milliseconds (positive if server is ahead)
   */
  getTimeOffset(): number {
    return this.serverTimeOffset;
  }

  /**
   * Check if clock sync is reasonably recent (within last 60 seconds)
   * @returns True if sync is recent and reliable
   */
  isSyncRecent(): boolean {
    return (Date.now() - this.lastSyncTime) < 60000;
  }

  /**
   * Handle clock sync response from server
   * @param message - Clock sync message from server
   */
  handleClockSyncResponse(message: ClockSyncMessage): void {
    if (!this.syncInProgress) {
      return; // Ignore unsolicited sync responses
    }

    const now = Date.now();
    const roundTripTime = now - message.clientTimestamp;
    const estimatedServerTime = message.serverTimestamp + (roundTripTime / 2);
    
    // Update server time offset
    this.serverTimeOffset = estimatedServerTime - now;
    this.lastSyncTime = now;
    this.syncInProgress = false;

    console.log(`🕐 Clock sync complete: offset=${this.serverTimeOffset}ms, RTT=${roundTripTime}ms`);
  }

  /**
   * Start periodic clock synchronization
   */
  private startPeriodicSync(): void {
    // Clear any existing timer
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    // Perform initial sync immediately
    this.performSync().catch(error => {
      console.warn("Initial clock sync failed:", error);
    });

    // Set up periodic re-sync
    this.syncTimer = setInterval(() => {
      this.performSync().catch(error => {
        console.warn("Periodic clock sync failed:", error);
      });
    }, this.SYNC_INTERVAL);
  }

  /**
   * Perform a single clock synchronization attempt
   */
  private async performSync(): Promise<void> {
    if (this.syncInProgress) {
      return; // Sync already in progress
    }

    if (!this.gameClient || !this.gameClient.getRoom()) {
      throw new Error("Game client or room not available for sync");
    }

    this.syncInProgress = true;
    const clientTimestamp = Date.now();

    try {
      // Send sync request to server
      this.gameClient.getRoom().send(MSG.CLOCK_SYNC, {
        clientTimestamp,
        serverTimestamp: 0 // Server will fill this
      } as ClockSyncMessage);

      // Set up timeout to reset sync state if no response
      setTimeout(() => {
        if (this.syncInProgress) {
          console.warn("Clock sync timeout - no response from server");
          this.syncInProgress = false;
        }
      }, this.SYNC_TIMEOUT);

    } catch (error) {
      this.syncInProgress = false;
      throw error;
    }
  }

  /**
   * Clean up timers and resources
   */
  dispose(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }
    this.syncInProgress = false;
    this.gameClient = null;
  }
}

/**
 * Singleton instance of the clock sync manager
 */
export const clockSyncManager = new ClockSyncManager();

/**
 * Utility function to get server-synchronized timestamp
 * @returns Synchronized timestamp in milliseconds
 */
export function getSyncedTimestamp(): number {
  return clockSyncManager.getSyncedTimestamp();
}

/**
 * Calculate time remaining for a round using synchronized clock
 * @param roundStartTime - Server timestamp when round started
 * @param roundDurationMs - Duration of round in milliseconds
 * @returns Time remaining in milliseconds (0 if expired)
 */
export function calculateTimeRemaining(roundStartTime: number, roundDurationMs: number): number {
  const syncedNow = getSyncedTimestamp();
  const elapsed = syncedNow - roundStartTime;
  return Math.max(0, roundDurationMs - elapsed);
}

/**
 * Format time in milliseconds to MM:SS format
 * @param timeMs - Time in milliseconds
 * @returns Formatted time string
 */
export function formatTime(timeMs: number): string {
  const seconds = Math.max(0, Math.ceil(timeMs / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
