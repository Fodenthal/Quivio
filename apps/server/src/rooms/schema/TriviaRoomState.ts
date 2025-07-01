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

export class ChatMessageState extends Schema {
  @type("string") playerId: string = "";
  @type("string") text: string = "";
  @type("number") timestamp: number = 0;
}

export class PromptState extends Schema {
  @type("string") id: string = "";
  @type("string") text: string = "";
  @type("string") category: string = "";
  @type("string") difficulty: string = "";
}

export class TriviaRoomState extends Schema {
  // Room settings
  @type("number") targetScore: number = 10;
  @type("number") roundTime: number = 30000;
  @type("number") maxPlayers: number = 8;
  @type("boolean") isPrivate: boolean = false;

  // Game state
  @type("boolean") gameStarted: boolean = false;
  @type("boolean") gameEnded: boolean = false;
  @type("boolean") gamePaused: boolean = false;
  @type("boolean") canStart: boolean = false;
  @type("number") currentRound: number = 0;
  @type("string") hostId: string = "";
  @type("string") winnerId: string = "";

  // Round state
  @type("number") roundStartTime: number = 0;
  @type("number") roundTimeRemaining: number = 0;
  @type("boolean") roundEnded: boolean = false;
  @type("string") correctAnswer: string = "";

  // Players
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();

  // Current prompt
  @type(PromptState) currentPrompt = new PromptState();

  // Round guesses
  @type({ map: GuessState }) roundGuesses = new MapSchema<GuessState>();

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

  addChatMessage(playerId: string, text: string) {
    const message = new ChatMessageState();
    message.playerId = playerId;
    message.text = text;
    message.timestamp = Date.now();
    this.chatMessages.set(`${Date.now()}_${playerId}`, message);
    
    // Keep only last 50 messages
    if (this.chatMessages.size > 50) {
      const keys = Array.from(this.chatMessages.keys());
      this.chatMessages.delete(keys[0]);
    }
  }
} 