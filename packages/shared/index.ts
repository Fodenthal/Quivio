export const MSG = {
  CHAT: "chat",
  PLAYER_READY: "player_ready",
  SUBMIT_GUESS: "submit_guess",
  START_GAME: "start_game",
  UPDATE_SETTINGS: "update_settings",
  JOIN_NEXT_GAME: "join_next_game",
  SET_TOPIC: "set_topic",
  SET_DIFFICULTY: "set_difficulty"
} as const;

export interface PlayerData {
  id: string;
  name: string;
  score: number;
  ready: boolean;
  isHost: boolean;
  joinedAt: number;
}

export interface Prompt {
  id: string;
  text: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  answer: string;
  // New fields for AI-generated questions
  topic?: string;
  difficultyLevel?: number; // 1-10 scale
  acceptableAnswers?: string[];
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

export interface DifficultyMessage {
  difficulty: number; // 1-10 scale
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

  // Game state
  gameStarted: boolean;
  gameEnded: boolean;
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
  roundTimeRemaining: number;
  roundEnded: boolean;
  correctAnswer: string;

  // AI Question Generation Settings
  currentTopic: string;
  currentDifficulty: number; // 1-10 scale

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
