import { Client } from "@colyseus/core";
import { TriviaRoomState } from "../../schema/TriviaRoomState";
import { GameStatus } from "@shared/index";

/**
 * Manages join/leave, host assignment, readiness, and pause/resume decisions.
 */
export class PlayerManager {
  private disposeTimer?: NodeJS.Timeout;
  private lastPlayerCount: number = 0;
  private peakPlayerCount: number = 0; // Track the maximum number of players this room has ever had
  private singlePlayerGracePeriodMs: number;
  
  constructor(
    private readonly state: TriviaRoomState, 
    private readonly onResume: () => void, 
    private readonly onPause: () => void, 
    private readonly onDispose: () => void, 
    private readonly disposeDelayMs: number
  ) {
    // Extended grace period for single player rooms to handle page refreshes
    this.singlePlayerGracePeriodMs = disposeDelayMs; // Same as normal disposal delay (60 seconds)
  }

  onAuth(client: Client, options: any): boolean {
    this.state.addPlayer(client.sessionId, options.playerName || `Player ${client.sessionId.slice(0, 6)}`);
    return true;
  }

  onJoin(client: Client): void {
    // Clear any pending disposal timer
    if (this.disposeTimer) { 
      clearTimeout(this.disposeTimer); 
      this.disposeTimer = undefined; 
    }
    
    console.log(`👤 Player joined: ${client.sessionId.slice(0, 6)}, total players: ${this.state.players.size}`);
    
    // Track peak player count for disposal logic
    this.peakPlayerCount = Math.max(this.peakPlayerCount, this.state.players.size);
    
    // Host assignment and game state management
    if (!this.state.hostId) this.state.setHost(client.sessionId);
    if (this.state.players.size >= 2 && this.state.gameStatus === GameStatus.WAITING) this.state.canStart = true;
    if (this.state.players.size >= 2 && this.state.gameStatus === GameStatus.IN_PROGRESS && this.state.gamePaused) this.onResume();
    
    // Update player count tracking AFTER all logic
    this.lastPlayerCount = this.state.players.size;
  }

  onLeave(client: Client): void {
    console.log(`👋 Player leaving: ${client.sessionId.slice(0, 6)}, players before removal: ${this.state.players.size}, lastPlayerCount: ${this.lastPlayerCount}`);
    
    this.state.removePlayer(client.sessionId);
    
    console.log(`📊 Players after removal: ${this.state.players.size}`);
    
    // Host reassignment if needed
    if (this.state.hostId === client.sessionId) {
      if (this.state.players.size > 0) {
        // Reassign host to remaining player
        const newHostId = Array.from(this.state.players.keys())[0];
        console.log(`👑 Reassigning host from ${client.sessionId.slice(0, 6)} to ${newHostId.slice(0, 6)}`);
        this.state.setHost(newHostId);
      } else {
        // No players left, clear host completely
        console.log(`👑 Clearing host - no players remaining`);
        this.state.hostId = "";
      }
    }
    
    // Game state management
    if (this.state.players.size < 2 && this.state.gameStatus === GameStatus.IN_PROGRESS) this.onPause();
    this.state.canStart = this.state.players.size >= 2 && this.state.gameStatus === GameStatus.WAITING;
    
    // Simple disposal logic: Grace period if room went from 1 player to 0 (likely refresh)
    if (this.state.players.size === 0) {
      const wasLikelySinglePlayerRefresh = this.lastPlayerCount === 1;
      
      if (wasLikelySinglePlayerRefresh) {
        // Room went from 1 to 0 players: Give grace period for page refresh
        const disposalDelay = this.singlePlayerGracePeriodMs;
        console.log(`📅 Single-player refresh detected - scheduling disposal in ${disposalDelay/1000}s grace period for reconnection`);
        
        this.disposeTimer = setTimeout(() => {
          console.log(`🗑️ Disposing room after ${disposalDelay/1000}s grace period`);
          this.onDispose();
        }, disposalDelay);
      } else {
        // Multi-player room or intentional leave: Dispose immediately when empty
        console.log(`🚀 Multi-player room empty - disposing immediately (had ${this.lastPlayerCount} players)`);
        this.onDispose();
      }
    } else if (this.disposeTimer) {
      // Cancel disposal if players rejoin
      clearTimeout(this.disposeTimer);
      this.disposeTimer = undefined;
    }
    
    // Update player count tracking
    this.lastPlayerCount = this.state.players.size;
  }
}


