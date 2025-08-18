import { TriviaRoomState } from "../../schema/TriviaRoomState";

/**
 * Encapsulates interval/timeouts used by the room for game loop and countdowns.
 * No game logic here; only timers and callbacks.
 */
export class TimerManager {
  private gameLoopTimer?: NodeJS.Timeout;
  private restartTimer?: NodeJS.Timeout;
  private disposeTimer?: NodeJS.Timeout;

  constructor(private readonly state: TriviaRoomState) {}

  startGameLoop(intervalMs: number, onTick: () => void): void {
    this.gameLoopTimer = setInterval(() => {
      onTick();
    }, intervalMs);
  }

  stopGameLoop(): void {
    if (this.gameLoopTimer) {
      clearInterval(this.gameLoopTimer);
      this.gameLoopTimer = undefined;
    }
  }

  scheduleDispose(delayMs: number, onDispose: () => void): void {
    this.disposeTimer = setTimeout(() => {
      onDispose();
    }, delayMs);
  }

  clearDispose(): void {
    if (this.disposeTimer) {
      clearTimeout(this.disposeTimer);
      this.disposeTimer = undefined;
    }
  }

  startRestartCountdown(onTick: () => void, onComplete: () => void): void {
    // Clear any existing restart timer
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
    }

    this.restartTimer = setInterval(() => {
      if (this.state.restartCountdown > 0) {
        this.state.restartCountdown--;
        onTick();
      } else {
        this.stopRestartCountdown();
        onComplete();
      }
    }, 1000);
  }

  stopRestartCountdown(): void {
    if (this.restartTimer) {
      clearInterval(this.restartTimer);
      this.restartTimer = undefined;
    }
  }
}


