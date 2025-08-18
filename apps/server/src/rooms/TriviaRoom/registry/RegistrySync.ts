import { GamePinRegistry } from "../../../services/GamePinRegistry";
import { TriviaRoomState } from "../../schema/TriviaRoomState";
import { GameStatus } from "@shared/index";

/**
 * Small helper to keep registry metadata in sync with room state.
 */
export class RegistrySync {
  constructor(private readonly roomId: string, private readonly state: TriviaRoomState) {}

  update(): void {
    const registry = GamePinRegistry.getInstance();
    registry.updateRoomMetadata(this.roomId, {
      roomName: this.state.roomName,
      topics: this.state.topics,
      difficulty: this.state.currentDifficulty,
      playerCount: this.state.players.size,
      maxPlayers: this.state.maxPlayers,
      isPrivate: this.state.isPrivate,
      gameStarted: this.state.gameStatus === GameStatus.IN_PROGRESS,
      canStart: this.state.canStart
    });
  }

  remove(): void {
    const registry = GamePinRegistry.getInstance();
    registry.removeRoomById(this.roomId);
  }
}


