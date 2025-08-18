import { TriviaRoomState } from "../../schema/TriviaRoomState";

/**
 * Owns round lifecycle bookkeeping and metrics; delegates to room for prompt loading.
 */
export class RoundManager {
  private roundStartTimestamp: number = 0;
  private roundTransitionMetrics: { duration: number; reason: string; playerCount: number }[] = [];

  constructor(private readonly state: TriviaRoomState) {}

  markRoundLoaded(): void {
    this.roundStartTimestamp = Date.now();
  }

  addRoundEndMetric(reason: string): void {
    const duration = Date.now() - this.roundStartTimestamp;
    const playerCount = this.state.players.size;
    this.roundTransitionMetrics.push({ duration, reason, playerCount });
    if (this.roundTransitionMetrics.length > 10) this.roundTransitionMetrics.shift();
  }

  getMetrics() {
    const avgDuration = this.roundTransitionMetrics.length > 0
      ? this.roundTransitionMetrics.reduce((sum, m) => sum + m.duration, 0) / this.roundTransitionMetrics.length
      : 0;
    return {
      recentRounds: this.roundTransitionMetrics,
      averageRoundDuration: Math.round(avgDuration),
    };
  }
}


