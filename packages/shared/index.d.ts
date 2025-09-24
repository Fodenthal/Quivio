export declare const MSG: {
    readonly CHAT: "chat";
    readonly PLAYER_READY: "player_ready";
    readonly SUBMIT_GUESS: "submit_guess";
    readonly START_GAME: "start_game";
    readonly UPDATE_SETTINGS: "update_settings";
    readonly JOIN_NEXT_GAME: "join_next_game";
    readonly SET_TOPIC: "set_topic";
    readonly SET_TOPICS: "set_topics";
    readonly SET_DIFFICULTY: "set_difficulty";
    readonly ROUND_START: "round_start";
    readonly ROUND_END: "round_end";
    readonly CLOCK_SYNC: "clock_sync";
};
export declare enum GameStatus {
    WAITING = "waiting",
    IN_PROGRESS = "in_progress",
    GAME_ENDED = "game_ended"
}
export interface PlayerData {
    id: string;
    name: string;
    score: number;
    ready: boolean;
    isHost: boolean;
    joinedAt: number;
    avatarHue: number;
}
export interface Prompt {
    id: string;
    text: string;
    category: string;
    difficulty: "easy" | "medium" | "hard";
    answer: string;
    topic?: string;
    difficultyLevel?: number;
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
    difficulty: number;
}
export interface RoundStartMessage {
    roundStartTime: number;
    roundDurationMs: number;
    roundNumber: number;
}
export interface RoundEndMessage {
    reason: "timer_expired" | "all_answered";
    roundNumber: number;
    correctAnswer?: string;
}
export interface ClockSyncMessage {
    clientTimestamp: number;
    serverTimestamp: number;
}
export interface RoomSettings {
    targetScore: number;
    roundTime: number;
    maxPlayers: number;
    isPrivate: boolean;
}
export interface GameState {
    targetScore: number;
    roundTime: number;
    maxPlayers: number;
    isPrivate: boolean;
    gamePin: string;
    roomName: string;
    gameStatus: GameStatus;
    gamePaused: boolean;
    canStart: boolean;
    currentRound: number;
    hostId: string;
    winnerId: string;
    restartCountdown: number;
    participatingPlayers: Map<string, boolean>;
    roundStartTime: number;
    roundEnded: boolean;
    correctAnswer: string;
    topics: string[];
    currentTopic: string;
    currentTopicIndex: number;
    currentDifficulty: number;
    players: Map<string, PlayerData>;
    currentPrompt: Prompt;
    roundGuesses: Map<string, Guess>;
    playerIncorrectGuesses: Map<string, PlayerIncorrectGuess>;
    chatMessages: Map<string, ChatMessage>;
}
