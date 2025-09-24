export const MSG = {
  CHAT: "chat",
  PLAYER_READY: "player_ready",
  SUBMIT_GUESS: "submit_guess",
  START_GAME: "start_game",
  UPDATE_SETTINGS: "update_settings",
  JOIN_NEXT_GAME: "join_next_game",
  SET_TOPIC: "set_topic",
  SET_TOPICS: "set_topics",
  SET_DIFFICULTY: "set_difficulty",
  // Timer event system
  ROUND_START: "round_start",
  ROUND_END: "round_end",
  CLOCK_SYNC: "clock_sync"
} as const;

export enum GameStatus {
  WAITING = "waiting",
  IN_PROGRESS = "in_progress",
  GAME_ENDED = "game_ended",
}

export interface PlayerData {
  id: string;
  name: string;
  score: number;
  ready: boolean;
  isHost: boolean;
  joinedAt: number;
  avatarHue: number; // 0-359 for HSL hue value
}

export interface Prompt {
  id: string;
  text: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  answer: string;
  // New fields for AI-generated questions
  topic?: string;
  difficultyLevel?: number; // 1-5 scale
  acceptableAnswers?: string[];
  image?: PromptImage;
}

export interface PromptImage {
  pointer?: string;
  url?: string;
  altText?: string;
  source?: string;
  attribution?: string;
  width?: number;
  height?: number;
  blurDataUrl?: string;
  externalId?: string;
}

export interface Guess {
  playerId: string;
  guess: string;
  isCorrect: boolean;
  timestamp: number;
}

export interface PlayerIncorrectGuess {
  playerId: string;
  guess: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  content: string;
  timestamp: number;
  type: "player" | "system";
}

export interface TopicMessage {
  topic: string;
}

export interface TopicsMessage {
  topics: string[];
}

export interface DifficultyMessage {
  difficulty: number; // 1-5 scale
}

// Timer event message interfaces
export interface RoundStartMessage {
  roundStartTime: number; // Server timestamp when round started
  roundDurationMs: number; // Duration of the round in milliseconds
  roundNumber: number; // Current round number for validation
}

export interface RoundEndMessage {
  reason: "timer_expired" | "all_answered"; // Why the round ended
  roundNumber: number; // Round number for validation
  correctAnswer?: string; // Optional: include correct answer
}

export interface ClockSyncMessage {
  clientTimestamp: number; // Client timestamp for round-trip calculation
  serverTimestamp: number; // Server timestamp for sync calculation
}

export interface RoomSettings {
  targetScore: number;
  roundTime: number;
  maxPlayers: number;
  isPrivate: boolean;
}

// Client-side game state interface (matches TriviaRoomState structure)
export interface GameState {
  // Room settings
  targetScore: number;
  roundTime: number;
  maxPlayers: number;
  isPrivate: boolean;
  gamePin: string;
  roomName: string;

  // Game state
  gameStatus: GameStatus;
  gamePaused: boolean;
  canStart: boolean;
  currentRound: number;
  hostId: string;
  winnerId: string;

  // Restart system (JKLM-style auto-restart)
  restartCountdown: number;
  participatingPlayers: Map<string, boolean>;

  // Round state
  roundStartTime: number;
  // roundTimeRemaining removed - clients calculate locally using event-driven timer system
  roundEnded: boolean;
  correctAnswer: string;

  // AI Question Generation Settings
  topics: string[];
  currentTopic: string;
  currentTopicIndex: number;
  currentDifficulty: number; // 1-5 scale

  // Players
  players: Map<string, PlayerData>;

  // Current prompt
  currentPrompt: Prompt;

  // Round guesses
  roundGuesses: Map<string, Guess>;

  // Player incorrect guesses (live tracking)
  playerIncorrectGuesses: Map<string, PlayerIncorrectGuess>;

  // Chat messages
  chatMessages: Map<string, ChatMessage>;
}
