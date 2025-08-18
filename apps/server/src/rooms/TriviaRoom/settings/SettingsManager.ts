import { TriviaRoomState } from "../../schema/TriviaRoomState";

export interface RoomSettingsUpdate {
  targetScore?: number;
  roundTime?: number;
  maxPlayers?: number;
}

/**
 * Applies host-controlled room settings and topic/difficulty changes.
 */
export class SettingsManager {
  constructor(private readonly state: TriviaRoomState, private readonly onBufferReset: () => void, private readonly onRegistryUpdate: () => void) {}

  updateRoomSettings(settings: RoomSettingsUpdate): void {
    if (settings.targetScore) this.state.targetScore = settings.targetScore;
    if (settings.roundTime) this.state.roundTime = settings.roundTime;
    if (settings.maxPlayers) this.state.maxPlayers = settings.maxPlayers;
  }

  setTopics(topics: string[]): void {
    if (!topics || topics.length === 0) return;
    const validTopics = topics.filter(t => t && t.trim().length > 0).map(t => t.trim());
    if (validTopics.length === 0) return;
    this.state.topics = validTopics;
    this.state.currentTopic = validTopics[0];
    this.state.currentTopicIndex = 0;
    this.onBufferReset();
    this.onRegistryUpdate();
  }

  setTopic(topic: string): void {
    if (!topic || topic.trim().length === 0) return;
    this.state.currentTopic = topic.trim();
    this.onBufferReset();
    this.onRegistryUpdate();
  }

  setDifficulty(difficulty: number): void {
    if (difficulty < 1 || difficulty > 5) return;
    this.state.currentDifficulty = difficulty;
    this.onBufferReset();
    this.onRegistryUpdate();
  }
}


