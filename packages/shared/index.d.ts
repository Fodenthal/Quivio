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
export type QuestionContentFormat = "plain" | "latex";
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
    format?: QuestionContentFormat;
}
export interface PromptImage {
    url: string;
    altText?: string;
    attribution?: string;
    width?: number;
    height?: number;
    source?: string;
    mime?: string;
    original_url?: string;
    storage_key?: string;
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
    defaultRoundTime?: number;
    maxPlayers: number;
    isPrivate: boolean;
}
export interface GameState {
    targetScore: number;
    roundTime: number;
    defaultRoundTime: number;
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
    nextPromptImageUrl: string;
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
export interface AdminRoomPlayerSummary {
    id: string;
    name: string;
    score: number;
    ready: boolean;
    isHost: boolean;
    joinedAt: number;
    avatarHue: number;
    connected: boolean;
}
export interface AdminRoundGuessSummary {
    playerId: string;
    guess: string;
    isCorrect: boolean;
    timestamp: number;
}
export interface AdminQuestionBufferMetrics {
    pendingQuestions: number;
    bufferCapacity: number;
    topicsTracked: number;
    totalQuestions: number;
    totalQueries: number;
    totalRawResponses: number;
}
export interface AdminRoomRegistrySummary {
    roomName: string;
    topics: string[];
    difficulty: number;
    playerCount: number;
    maxPlayers: number;
    isPrivate: boolean;
    gameStarted: boolean;
    canStart: boolean;
    createdAt: number;
}
export interface AdminRoomDetails {
    roomId: string;
    roomName: string;
    gamePin: string;
    createdAt: number | null;
    isPrivate: boolean;
    targetScore: number;
    roundTime: number;
    state: {
        gameStatus: GameStatus;
        gamePaused: boolean;
        canStart: boolean;
        currentRound: number;
        currentTopic: string;
        currentDifficulty: number;
        hostId: string;
        winnerId: string;
        restartCountdown: number;
        roundStartTime: number;
        roundEnded: boolean;
        correctAnswer: string;
        roundTime: number;
        defaultRoundTime: number;
    };
    players: AdminRoomPlayerSummary[];
    roundGuesses: AdminRoundGuessSummary[];
    currentPrompt: {
        id: string;
        text: string;
        topic: string;
        difficultyLevel: number;
        acceptableAnswers: number;
        hasImage: boolean;
        format: QuestionContentFormat;
    } | null;
    registry: AdminRoomRegistrySummary | null;
    questionBuffer: AdminQuestionBufferMetrics;
    connectedClients: number;
    maxClients: number;
    autoDispose: boolean;
    serverTime: number;
    defaultRoundTime: number;
}
export interface AdminRoomSnapshot {
    roomId: string;
    processId: string | null;
    locked: boolean;
    clients: number;
    maxClients: number;
    metadata: Record<string, unknown> | null;
    details: AdminRoomDetails | null;
}
