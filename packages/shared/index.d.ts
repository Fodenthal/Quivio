export declare const MSG: {
    readonly CHAT: "chat";
    readonly PLAYER_READY: "player_ready";
    readonly SUBMIT_GUESS: "submit_guess";
    readonly START_GAME: "start_game";
    readonly UPDATE_SETTINGS: "update_settings";
    readonly JOIN_NEXT_GAME: "join_next_game";
    readonly SET_TOPIC: "set_topic";
    readonly SET_DIFFICULTY: "set_difficulty";
};
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
    topic?: string;
    difficultyLevel?: number;
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
    difficulty: number;
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
    gameStarted: boolean;
    gameEnded: boolean;
    gamePaused: boolean;
    canStart: boolean;
    currentRound: number;
    hostId: string;
    winnerId: string;
    restartCountdown: number;
    participatingPlayers: Map<string, boolean>;
    roundStartTime: number;
    roundTimeRemaining: number;
    roundEnded: boolean;
    correctAnswer: string;
    currentTopic: string;
    currentDifficulty: number;
    players: Map<string, PlayerData>;
    currentPrompt: Prompt;
    roundGuesses: Map<string, Guess>;
    playerIncorrectGuesses: Map<string, PlayerIncorrectGuess>;
    chatMessages: Map<string, ChatMessage>;
}
