import { Client } from "@colyseus/core";
import { TriviaRoomState } from "../../schema/TriviaRoomState";
import { GameStatus } from "@shared/index";

/**
 * Manages join/leave, host assignment, readiness, and pause/resume decisions.
 */
export class PlayerManager {
  constructor(
    private readonly state: TriviaRoomState, 
    private readonly onResume: () => void, 
    private readonly onPause: () => void, 
    private readonly onDispose: () => void
  ) {
    // Colyseus now handles reconnection timing via allowReconnection()
  }

  onAuth(client: Client, options: any): boolean {
    this.state.addPlayer(client.sessionId, options.playerName || `Player ${client.sessionId.slice(0, 6)}`);
    return true;
  }

  onJoin(client: Client): void {
    console.log(`👤 Player joined: ${client.sessionId.slice(0, 6)}, total players: ${this.state.players.size}`);
    
    // Host assignment and game state management
    if (!this.state.hostId) {
      console.log(`👑 No host found, assigning ${client.sessionId.slice(0, 6)} as host`);
      this.state.setHost(client.sessionId);
    }
    
    if (this.state.players.size >= 2 && this.state.gameStatus === GameStatus.WAITING) this.state.canStart = true;
    if (this.state.players.size >= 2 && this.state.gameStatus === GameStatus.IN_PROGRESS && this.state.gamePaused) this.onResume();
  }

  /**
   * Handle actual player removal after reconnection window expires or consented leave
   * This replaces the old onLeave method and contains all the removal logic
   */
  handlePlayerRemoval(client: Client): void {
    console.log(`👋 Removing player: ${client.sessionId.slice(0, 6)}, players before removal: ${this.state.players.size}`);
    
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
    
    // Room disposal logic - dispose immediately when empty (Colyseus handles reconnection timing)
    if (this.state.players.size === 0) {
      console.log(`🗑️ Room empty - disposing immediately (Colyseus handled reconnection window)`);
      this.onDispose();
    }
  }

  // Removed deprecated onLeave method - use handlePlayerRemoval directly
}


