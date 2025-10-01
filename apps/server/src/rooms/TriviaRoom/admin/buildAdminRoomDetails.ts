import { GameStatus, type AdminRoomDetails } from "@shared/index";
import type { RoomMetadata } from "../../../services/GamePinRegistry";
import type { TriviaRoomState } from "../../schema/TriviaRoomState";

interface BufferMetrics {
  pendingQuestions: number;
  bufferCapacity: number;
  topicsTracked: number;
}

interface BufferAnalytics {
  totalQuestions: number;
  totalQueries: number;
  totalRawResponses: number;
}

interface BuildAdminRoomDetailsParams {
  roomId: string;
  roomName: string;
  gamePin: string;
  isPrivate: boolean;
  targetScore: number;
  roundTime: number;
  state: TriviaRoomState;
  registry: RoomMetadata | null;
  bufferMetrics: BufferMetrics;
  bufferAnalytics: BufferAnalytics;
  serverTime: number;
  maxClients: number;
  autoDispose: boolean;
  fallbackCreatedAt: number | null;
  connectedClientIds: Set<string>;
}

export function buildAdminRoomDetails(params: BuildAdminRoomDetailsParams): AdminRoomDetails {
  const {
    roomId,
    roomName,
    gamePin,
    isPrivate,
    targetScore,
    roundTime,
    state,
    registry,
    bufferMetrics,
    bufferAnalytics,
    serverTime,
    maxClients,
    autoDispose,
    fallbackCreatedAt,
    connectedClientIds,
  } = params;

  const registrySummary = registry
    ? {
        roomName: registry.roomName,
        topics: registry.topics,
        difficulty: registry.difficulty,
        playerCount: registry.playerCount,
        maxPlayers: registry.maxPlayers,
        isPrivate: registry.isPrivate,
        gameStarted: registry.gameStarted,
        canStart: registry.canStart,
        createdAt: registry.createdAt,
      }
    : null;

  const players = Array.from(state.players.values())
    .map((player) => ({
      id: player.id,
      name: player.name,
      score: player.score,
      ready: player.ready,
      isHost: player.isHost,
      joinedAt: player.joinedAt,
      avatarHue: player.avatarHue,
      connected: connectedClientIds.has(player.id),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.joinedAt - b.joinedAt;
    });

  const roundGuesses = Array.from(state.roundGuesses.values())
    .map((guess) => ({
      playerId: guess.playerId,
      guess: guess.guess,
      isCorrect: guess.isCorrect,
      timestamp: guess.timestamp,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  const prompt = state.currentPrompt;
  const promptSummary = prompt && prompt.id
    ? {
        id: prompt.id,
        text: prompt.text,
        topic: prompt.topic,
        difficultyLevel: prompt.difficultyLevel,
        acceptableAnswers: Array.isArray(prompt.acceptableAnswers) ? prompt.acceptableAnswers.length : 0,
        hasImage: !!prompt.image?.url,
      }
    : null;

  const createdAt = registrySummary?.createdAt ?? fallbackCreatedAt ?? null;

  return {
    roomId,
    roomName,
    gamePin,
    createdAt,
    isPrivate,
    targetScore,
    roundTime,
    state: {
      gameStatus: state.gameStatus as GameStatus,
      gamePaused: state.gamePaused,
      canStart: state.canStart,
      currentRound: state.currentRound,
      currentTopic: state.currentTopic,
      currentDifficulty: state.currentDifficulty,
      hostId: state.hostId,
      winnerId: state.winnerId,
      restartCountdown: state.restartCountdown,
      roundStartTime: state.roundStartTime,
      roundEnded: state.roundEnded,
      correctAnswer: state.correctAnswer,
    },
    players,
    roundGuesses,
    currentPrompt: promptSummary,
    registry: registrySummary,
    questionBuffer: {
      pendingQuestions: bufferMetrics.pendingQuestions,
      bufferCapacity: bufferMetrics.bufferCapacity,
      topicsTracked: bufferMetrics.topicsTracked,
      totalQuestions: bufferAnalytics.totalQuestions,
      totalQueries: bufferAnalytics.totalQueries,
      totalRawResponses: bufferAnalytics.totalRawResponses,
    },
    connectedClients: connectedClientIds.size,
    maxClients,
    autoDispose,
    serverTime,
  };
}
