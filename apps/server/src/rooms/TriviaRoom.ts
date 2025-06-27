import { Room, Client } from "@colyseus/core";
import { TriviaRoomState } from "./schema/TriviaRoomState";
import { MSG } from "@shared/index";

export interface RoomOptions {
  targetScore?: number;
  roundTime?: number;
  maxPlayers?: number;
  isPrivate?: boolean;
}

interface PlayerReadyMessage {
  ready: boolean;
}

interface GuessMessage {
  guess: string;
}

interface ChatMessage {
  text: string;
}

interface SettingsMessage {
  targetScore?: number;
  roundTime?: number;
  maxPlayers?: number;
}

export class TriviaRoom extends Room<TriviaRoomState> {
  maxClients = 8;
  private roundTimer?: NodeJS.Timeout;
  private gameLoopTimer?: NodeJS.Timeout;
  private readonly DEFAULT_TARGET_SCORE = 10;
  private readonly DEFAULT_ROUND_TIME = 30000; // 30 seconds
  private readonly ROUND_END_DELAY = 2000; // 2 seconds to show correct answer

  onCreate(options: RoomOptions = {}) {
    console.log("Creating TriviaRoom:", this.roomId);
    
    // Initialize room state
    this.state = new TriviaRoomState();
    this.state.targetScore = options.targetScore || this.DEFAULT_TARGET_SCORE;
    this.state.roundTime = options.roundTime || this.DEFAULT_ROUND_TIME;
    this.state.isPrivate = options.isPrivate || false;
    this.state.maxPlayers = options.maxPlayers || this.maxClients;
    
    // Set up message handlers
    this.setupMessageHandlers();
    
    // Start the game loop
    this.startGameLoop();
  }

  onJoin(client: Client, options: any) {
    console.log(`Player ${client.sessionId} joined room ${this.roomId}`);
    
    // Add player to state
    this.state.addPlayer(client.sessionId, options.playerName || `Player ${client.sessionId.slice(0, 6)}`);
    
    // If this is the first player, make them the host
    if (this.state.players.size === 1) {
      this.state.setHost(client.sessionId);
    }
    
    // If we have enough players and game hasn't started, allow starting
    if (this.state.players.size >= 2 && !this.state.gameStarted) {
      this.state.canStart = true;
    }
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`Player ${client.sessionId} left room ${this.roomId}`);
    
    // Remove player from state
    this.state.removePlayer(client.sessionId);
    
    // If host left, assign new host
    if (this.state.hostId === client.sessionId && this.state.players.size > 0) {
      const newHostId = Array.from(this.state.players.keys())[0];
      this.state.setHost(newHostId);
    }
    
    // If not enough players, pause game
    if (this.state.players.size < 2 && this.state.gameStarted) {
      this.pauseGame();
    }
    
    // Update can start status
    this.state.canStart = this.state.players.size >= 2 && !this.state.gameStarted;
  }

  onDispose() {
    console.log(`Disposing TriviaRoom: ${this.roomId}`);
    
    // Clean up timers
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
    }
    if (this.gameLoopTimer) {
      clearInterval(this.gameLoopTimer);
    }
  }

  private setupMessageHandlers() {
    // Handle player ready state
    this.onMessage(MSG.PLAYER_READY, (client, message: PlayerReadyMessage) => {
      // ✅ Ignore malformed payloads
      if (typeof message?.ready === "boolean") {
        this.state.setPlayerReady(client.sessionId, message.ready);
        this.checkGameStart();
      }
    });

    // Handle guess submission
    this.onMessage(MSG.SUBMIT_GUESS, (client, message: GuessMessage) => {
      // ✅ Only act on well-formed messages
      if (typeof message?.guess === "string") {
        this.handleGuess(client.sessionId, message.guess);
      }
    });

    // Handle game start request
    this.onMessage(MSG.START_GAME, (client) => {
      // ✅ Re-evaluate readiness on demand instead of relying on a stale flag
      if (client.sessionId !== this.state.hostId) {
        return;
      }
      
      if (this.state.gameStarted) {
        return;
      }

      const readyPlayers = Array.from(this.state.players.values()).filter(p => p.ready);
      
      if (readyPlayers.length >= 2) {
        this.startGame();
      }
    });

    // Handle chat messages
    this.onMessage(MSG.CHAT, (client, message: ChatMessage) => {
      if (typeof message?.text === "string") {
        this.handleChatMessage(client.sessionId, message.text);
      }
    });

    // Handle room settings update
    this.onMessage(MSG.UPDATE_SETTINGS, (client, message: SettingsMessage) => {
      if (client.sessionId === this.state.hostId) {
        this.updateRoomSettings(message);
      }
    });
  }

  private startGameLoop() {
    // Game loop runs every 50ms to update timers and check game state
    this.gameLoopTimer = setInterval(() => {
      if (this.state.gameStarted && !this.state.gamePaused) {
        this.updateGameState();
      }
    }, 50);
  }

  private updateGameState() {
    // Update round timer
    if (this.state.currentRound > 0 && this.state.roundStartTime > 0) {
      const elapsed = Date.now() - this.state.roundStartTime;
      this.state.roundTimeRemaining = Math.max(0, this.state.roundTime - elapsed);
      
      // Check if round time expired
      if (this.state.roundTimeRemaining <= 0 && !this.state.roundEnded) {
        this.endRound();
      }
    }
  }

  private checkGameStart() {
    const readyPlayers = Array.from(this.state.players.values()).filter(p => p.ready);
    this.state.canStart = readyPlayers.length >= 2 && !this.state.gameStarted;
  }

  private startGame() {
    console.log(`Starting game in room ${this.roomId}`);
    
    this.state.gameStarted = true;
    this.state.canStart = false;
    this.state.currentRound = 0;
    this.state.gamePaused = false;
    this.state.gameEnded = false;
    this.state.winnerId = "";
    
    // Start first round
    this.startNewRound();
  }

  private startNewRound() {
    this.state.currentRound++;
    this.state.roundStartTime = Date.now();
    this.state.roundTimeRemaining = this.state.roundTime;
    this.state.roundEnded = false;
    this.state.correctAnswer = "";
    
    // Clear previous round's guesses
    this.state.clearRoundGuesses();
    
    // Load new prompt (placeholder for now)
    this.loadNewPrompt();
    
    console.log(`Started round ${this.state.currentRound} in room ${this.roomId}`);
  }

  private loadNewPrompt() {
    // TODO: Implement prompt loading system
    // For now, use placeholder data
    this.state.currentPrompt.id = `prompt_${this.state.currentRound}`;
    this.state.currentPrompt.text = `What is the capital of France?`;
    this.state.currentPrompt.category = "geography";
    this.state.currentPrompt.difficulty = "easy";
  }

  private handleGuess(playerId: string, guess: string) {
    if (
      !this.state.gameStarted ||
      this.state.roundEnded ||
      this.state.gamePaused ||
      typeof guess !== "string" ||
      !guess.trim()
    ) {
      return;
    }

    // Check if we're actually in a round
    if (this.state.currentRound === 0) {
      return;
    }

    // Check if player already guessed this round
    if (this.state.roundGuesses.has(playerId)) {
      return; // Player already guessed this round
    }

    // Normalize guess for comparison
    const normalizedGuess = this.normalizeAnswer(guess);
    const correctAnswer = this.normalizeAnswer("Paris"); // TODO: Get from prompt
    
    // Check if guess is correct
    const isCorrect = normalizedGuess === correctAnswer;
    
    // Record the guess
    this.state.addGuess(playerId, guess, isCorrect);
    
    if (isCorrect) {
      this.handleCorrectGuess(playerId);
    }
  }

  private handleCorrectGuess(playerId: string) {
    // Calculate score based on time
    const elapsed = Date.now() - this.state.roundStartTime;
    const score = Math.max(1, Math.floor((this.state.roundTime - elapsed) / 1000) + 1);
    
    // Award points
    this.state.addScore(playerId, score);
    
    // Set correct answer
    this.state.correctAnswer = "Paris"; // TODO: Get from prompt
    
    // Check for game winner immediately
    const winner = this.checkForWinner();
    if (winner) {
      this.endGame(winner);
      return;
    }
    
    // End round after delay
    this.roundTimer = setTimeout(() => {
      this.endRound();
    }, this.ROUND_END_DELAY);
  }

  private endRound() {
    if (this.state.roundEnded) return;
    
    this.state.roundEnded = true;
    this.state.roundTimeRemaining = 0;
    
    // Clear the round timer if it exists
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = undefined;
    }
    
    // Check for game winner
    const winner = this.checkForWinner();
    if (winner) {
      this.endGame(winner);
    } else {
      // Start next round after delay
      setTimeout(() => {
        if (this.state.gameStarted && !this.state.gameEnded) {
          this.startNewRound();
        }
      }, 3000); // 3 second delay between rounds
    }
  }

  private checkForWinner(): string | null {
    for (const [playerId, player] of this.state.players) {
      if (player.score >= this.state.targetScore) {
        return playerId;
      }
    }
    return null;
  }

  private endGame(winnerId: string) {
    this.state.gameEnded = true;
    this.state.winnerId = winnerId;
    this.state.gameStarted = false;
    this.state.gamePaused = false;
    
    console.log(`Game ended in room ${this.roomId}. Winner: ${winnerId}`);
  }

  private pauseGame() {
    this.state.gamePaused = true;
    
    // Clear any active timers
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = undefined;
    }
  }

  private handleChatMessage(playerId: string, text: string) {
    // Basic chat moderation - filter inappropriate content
    const sanitizedText = this.sanitizeChatMessage(text);
    if (sanitizedText) {
      this.state.addChatMessage(playerId, sanitizedText);
    }
  }

  private updateRoomSettings(settings: Partial<RoomOptions>) {
    if (settings.targetScore) {
      this.state.targetScore = settings.targetScore;
    }
    if (settings.roundTime) {
      this.state.roundTime = settings.roundTime;
    }
    if (settings.maxPlayers) {
      this.state.maxPlayers = settings.maxPlayers;
    }
  }

  private normalizeAnswer(answer: string): string {
    return answer.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  private sanitizeChatMessage(text: string): string {
    // Basic sanitization - remove HTML and limit length
    return text
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .substring(0, 200)
      .trim();
  }
}