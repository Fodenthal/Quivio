import { Schema, type, MapSchema } from "@colyseus/schema";
import { PlayerData, Prompt, Guess, ChatMessage, RoomSettings } from "@shared/index";

export class PlayerState extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "";
  @type("number") score: number = 0;
  @type("boolean") ready: boolean = false;
  @type("boolean") isHost: boolean = false;
  @type("number") joinedAt: number = 0;
}

export class GuessState extends Schema {
  @type("string") playerId: string = "";
  @type("string") guess: string = "";
  @type("boolean") isCorrect: boolean = false;
  @type("number") timestamp: number = 0;
}

export class PlayerIncorrectGuessState extends Schema {
  @type("string") playerId: string = "";
  @type("string") guess: string = "";
  @type("number") timestamp: number = 0;
}

export class ChatMessageState extends Schema {
  @type("string") id: string = "";
  @type("string") playerId: string = "";
  @type("string") playerName: string = "";
  @type("string") content: string = "";
  @type("number") timestamp: number = 0;
  @type("string") type: string = "player";
}

export class PromptState extends Schema {
  @type("string") id: string = "";
  @type("string") text: string = "";
  @type("string") category: string = "";
  @type("string") difficulty: string = "";
  @type("string") topic: string = "";
  @type("number") difficultyLevel: number = 3; // 1-5 scale
  @type(["string"]) acceptableAnswers: string[] = [];
}

export class TriviaRoomState extends Schema {
  // Room settings
  @type("number") targetScore: number = 10;
  @type("number") roundTime: number = 30000;
  @type("number") maxPlayers: number = 8;
  @type("boolean") isPrivate: boolean = false;
  @type("string") gamePin: string = "";
  @type("string") roomName: string = "";

  // Game state
  @type("boolean") gameStarted: boolean = false;
  @type("boolean") gameEnded: boolean = false;
  @type("boolean") gamePaused: boolean = false;
  @type("boolean") canStart: boolean = false;
  @type("number") currentRound: number = 0;
  @type("string") hostId: string = "";
  @type("string") winnerId: string = "";

  // Restart system (JKLM-style auto-restart)
  @type("number") restartCountdown: number = 0;
  @type({ map: "boolean" }) participatingPlayers = new MapSchema<boolean>();

  // Round state
  @type("number") roundStartTime: number = 0;
  @type("number") roundTimeRemaining: number = 0;
  @type("boolean") roundEnded: boolean = false;
  @type("string") correctAnswer: string = "";

  // AI Question Generation Settings
  @type(["string"]) topics: string[] = [];
  @type("string") currentTopic: string = "";
  @type("number") currentTopicIndex: number = 0;
  @type("number") currentDifficulty: number = 3; // 1-5 scale

  // Players
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();

  // Current prompt
  @type(PromptState) currentPrompt = new PromptState();

  // Round guesses
  @type({ map: GuessState }) roundGuesses = new MapSchema<GuessState>();

  // Order of correct guesses for scoring (JKLM-style)
  @type(["string"]) correctGuessOrder: string[] = [];

  // Player incorrect guesses (live tracking of wrong answers)
  @type({ map: PlayerIncorrectGuessState }) playerIncorrectGuesses = new MapSchema<PlayerIncorrectGuessState>();

  // Chat messages
  @type({ map: ChatMessageState }) chatMessages = new MapSchema<ChatMessageState>();

  // Methods for state management
  addPlayer(id: string, name: string) {
    const player = new PlayerState();
    player.id = id;
    player.name = name;
    player.joinedAt = Date.now();
    this.players.set(id, player);
  }

  removePlayer(id: string) {
    this.players.delete(id);
  }

  setHost(id: string) {
    console.log(`setHost called with id: ${id}`);
    // Clear previous host
    for (const player of this.players.values()) {
      if (player.isHost) {
        console.log(`Clearing host flag for player: ${player.id}`);
      }
      player.isHost = false;
    }
    
    // Set new host
    const player = this.players.get(id);
    if (player) {
      player.isHost = true;
      this.hostId = id;
      console.log(`Set player ${id} as host. Player object:`, {
        id: player.id,
        name: player.name,
        isHost: player.isHost
      });
    } else {
      console.log(`Warning: Could not find player ${id} to set as host`);
    }
  }

  setPlayerReady(id: string, ready: boolean) {
    const player = this.players.get(id);
    if (player) {
      player.ready = ready;
    }
  }

  addScore(id: string, points: number) {
    const player = this.players.get(id);
    if (player) {
      player.score += points;
    }
  }

  addGuess(playerId: string, guess: string, isCorrect: boolean) {
    const guessState = new GuessState();
    guessState.playerId = playerId;
    guessState.guess = guess;
    guessState.isCorrect = isCorrect;
    guessState.timestamp = Date.now();
    this.roundGuesses.set(playerId, guessState);
  }

  clearRoundGuesses() {
    this.roundGuesses.clear();
  }

  /**
   * Records an incorrect guess for a player, replacing any previous incorrect guess.
   * This tracks the most recent wrong answer to display under the player's name.
   * 
   * @param playerId - The ID of the player making the guess
   * @param guess - The incorrect guess text
   */
  addIncorrectGuess(playerId: string, guess: string) {
    const incorrectGuess = new PlayerIncorrectGuessState();
    incorrectGuess.playerId = playerId;
    incorrectGuess.guess = guess;
    incorrectGuess.timestamp = Date.now();
    this.playerIncorrectGuesses.set(playerId, incorrectGuess);
  }

  /**
   * Removes a player's incorrect guess (called when they answer correctly).
   * This ensures correct answers don't show the old incorrect guess.
   * 
   * @param playerId - The ID of the player whose incorrect guess to remove
   */
  removeIncorrectGuess(playerId: string) {
    // Only delete if the player actually has an incorrect guess
    if (this.playerIncorrectGuesses.has(playerId)) {
      this.playerIncorrectGuesses.delete(playerId);
    }
  }

  /**
   * Clears all incorrect guesses between rounds.
   * This resets the display for the next round.
   */
  clearIncorrectGuesses() {
    this.playerIncorrectGuesses.clear();
  }

  addChatMessage(playerId: string, content: string, type: "player" | "system" = "player") {
    const player = this.players.get(playerId);
    const playerName = player ? player.name : "Unknown";
    
    const message = new ChatMessageState();
    message.id = `${Date.now()}_${playerId}_${Math.random().toString(36).substr(2, 9)}`;
    message.playerId = playerId;
    message.playerName = playerName;
    message.content = content;
    message.timestamp = Date.now();
    message.type = type;
    this.chatMessages.set(message.id, message);
    
    // Keep only last 50 messages
    if (this.chatMessages.size > 50) {
      const keys = Array.from(this.chatMessages.keys());
      this.chatMessages.delete(keys[0]);
    }
  }

  addSystemMessage(content: string) {
    const message = new ChatMessageState();
    message.id = `${Date.now()}_system_${Math.random().toString(36).substr(2, 9)}`;
    message.playerId = "system";
    message.playerName = "System";
    message.content = content;
    message.timestamp = Date.now();
    message.type = "system";
    this.chatMessages.set(message.id, message);
    
    // Keep only last 50 messages
    if (this.chatMessages.size > 50) {
      const keys = Array.from(this.chatMessages.keys());
      this.chatMessages.delete(keys[0]);
    }
  }

  /**
   * JKLM-style restart system methods
   */
  
  startRestartCountdown() {
    this.restartCountdown = 15; // 15 seconds like JKLM
    this.participatingPlayers.clear();
  }

  addParticipatingPlayer(playerId: string) {
    this.participatingPlayers.set(playerId, true);
  }

  getParticipatingPlayerCount(): number {
    return this.participatingPlayers.size;
  }

  getParticipatingPlayerIds(): string[] {
    return Array.from(this.participatingPlayers.keys());
  }

  clearRestartSystem() {
    this.restartCountdown = 0;
    this.participatingPlayers.clear();
  }
} 