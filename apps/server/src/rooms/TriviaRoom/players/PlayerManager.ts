import { Client } from "@colyseus/core";
import { TriviaRoomState } from "../../schema/TriviaRoomState";
import { GameStatus } from "@shared/index";

/**
 * Manages join/leave, host assignment, readiness, and pause/resume decisions.
 */
export class PlayerManager {
  private disposeTimer?: NodeJS.Timeout;
  constructor(private readonly state: TriviaRoomState, private readonly onResume: () => void, private readonly onPause: () => void, private readonly onDispose: () => void, private readonly disposeDelayMs: number) {}

  onAuth(client: Client, options: any): boolean {
    this.state.addPlayer(client.sessionId, options.playerName || `Player ${client.sessionId.slice(0, 6)}`);
    return true;
  }

  onJoin(client: Client): void {
    if (this.disposeTimer) { clearTimeout(this.disposeTimer); this.disposeTimer = undefined; }
    if (!this.state.hostId) this.state.setHost(client.sessionId);
    if (this.state.players.size >= 2 && this.state.gameStatus === GameStatus.WAITING) this.state.canStart = true;
    if (this.state.players.size >= 2 && this.state.gameStatus === GameStatus.IN_PROGRESS && this.state.gamePaused) this.onResume();
  }

  onLeave(client: Client): void {
    this.state.removePlayer(client.sessionId);
    if (this.state.hostId === client.sessionId && this.state.players.size > 0) {
      const newHostId = Array.from(this.state.players.keys())[0];
      this.state.setHost(newHostId);
    }
    if (this.state.players.size < 2 && this.state.gameStatus === GameStatus.IN_PROGRESS) this.onPause();
    this.state.canStart = this.state.players.size >= 2 && this.state.gameStatus === GameStatus.WAITING;
    if (this.state.players.size === 0) {
      this.disposeTimer = setTimeout(() => this.onDispose(), this.disposeDelayMs);
    } else if (this.disposeTimer) {
      clearTimeout(this.disposeTimer);
      this.disposeTimer = undefined;
    }
  }
}


