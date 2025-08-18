import { GeminiService } from "../../../services/GeminiService";
import { TriviaRoomState } from "../../schema/TriviaRoomState";
import { GameStatus } from "@shared/index";
import { computeScore } from "../scoring/ScoringRules";

/**
 * Handles guess processing and scoring, updating the room state accordingly.
 */
export class GuessManager {
  constructor(private readonly state: TriviaRoomState) {}

  /**
   * Set the current round's answer payload.
   */
  setAnswerPayload(_correctAnswer: string, _acceptableAnswers: string[]): void {}

  /**
   * Process an incoming guess. Returns true if handled, false if ignored.
   */
  handleGuess(playerId: string, rawGuess: string, onAllAnswered: () => void, onGameWon: (winnerId: string) => void): boolean {
    if (!this.state.currentPrompt || !this.state.currentPrompt.text || this.state.gameStatus !== GameStatus.IN_PROGRESS || this.state.gamePaused || this.state.roundEnded) {
      return false;
    }
    if (this.state.currentRound === 0) return false;
    if (this.state.roundGuesses.has(playerId)) return false;

    const guess = (rawGuess ?? "").toString();
    const acceptable = this.state.currentPrompt?.acceptableAnswers || [];
    const isCorrect = GeminiService.isAnswerAcceptable(guess, acceptable);
    if (isCorrect) {
      this.state.removeIncorrectGuess(playerId);
      this.state.addGuess(playerId, guess, true);
      this.applyScoring(playerId, onGameWon);
      if (this.checkAllPlayersAnswered()) onAllAnswered();
      return true;
    } else {
      this.state.addIncorrectGuess(playerId, guess.trim());
      return true;
    }
  }

  private applyScoring(playerId: string, onGameWon: (winnerId: string) => void): void {
    this.state.correctGuessOrder.push(playerId);
    const position = this.state.correctGuessOrder.length - 1;
    const score = computeScore({ position, roundStartTime: this.state.roundStartTime, roundTimeMs: this.state.roundTime });
    this.state.addScore(playerId, score);
    const winner = this.checkForWinner();
    if (winner) onGameWon(winner);
  }

  private checkAllPlayersAnswered(): boolean {
    const activePlayers = Array.from(this.state.players.values());
    if (activePlayers.length === 0) return false;
    for (const player of activePlayers) {
      const playerGuess = this.state.roundGuesses.get(player.id);
      if (!playerGuess || !playerGuess.isCorrect) return false;
    }
    return true;
  }

  private checkForWinner(): string | null {
    for (const [playerId, player] of this.state.players) {
      if (player.score >= this.state.targetScore) return playerId;
    }
    return null;
  }
}


