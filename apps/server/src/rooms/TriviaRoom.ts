import { Room, Client } from "@colyseus/core";
import { TriviaRoomState } from "./schema/TriviaRoomState";
import { MSG, TopicMessage, TopicsMessage, DifficultyMessage, GameStatus } from "@shared/index";
import { GeminiService, GeneratedQuestion } from "../services/GeminiService";
import { DatabaseFactory } from "../services/DatabaseFactory";
import { GamePinRegistry } from "../services/GamePinRegistry";
import { QuestionBufferManager } from "./TriviaRoom/question/QuestionBufferManager";
import { PromptLoader } from "./TriviaRoom/question/PromptLoader";
import { STATIC_PROMPTS } from "./TriviaRoom/staticPrompts";
import { PinGenerator } from "./TriviaRoom/registry/PinGenerator";
import { RegistrySync } from "./TriviaRoom/registry/RegistrySync";
import { ChatManager } from "./TriviaRoom/chat/ChatManager";
import { SettingsManager } from "./TriviaRoom/settings/SettingsManager";
import { PlayerManager } from "./TriviaRoom/players/PlayerManager";
import { GuessManager } from "./TriviaRoom/guess/GuessManager";
import { RoundManager } from "./TriviaRoom/round/RoundManager";
import { Logger, createChildLogger } from "../utils/logger";

export interface RoomOptions {
  targetScore?: number;
  roundTime?: number;
  maxPlayers?: number;
  isPrivate?: boolean;
  roomName?: string;
  topics?: string[];
  difficulty?: number;
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

// StaticPrompt type moved alongside static prompts

export class TriviaRoom extends Room<TriviaRoomState> {
  maxClients = 8;
  private roundTimer?: NodeJS.Timeout;
  private gameLoopTimer?: NodeJS.Timeout;
  private restartTimer?: NodeJS.Timeout;
  private readonly DEFAULT_TARGET_SCORE = 100;
  private readonly DEFAULT_ROUND_TIME = 20000; // 20 seconds
  private readonly ROOM_DISPOSE_DELAY = 60000; // 60 seconds before disposing empty room
  private readonly GAME_LOOP_INTERVAL = 100; // 100ms for better performance vs 50ms
  private readonly TIMER_UPDATE_THRESHOLD = 100; // Only update timer if changed by 100ms+
  private disposeTimer?: NodeJS.Timeout;
  private registrySync!: RegistrySync;
  private pinGenerator = new PinGenerator();
  private chatManager!: ChatManager;
  private settingsManager!: SettingsManager;
  private playerManager!: PlayerManager;
  private lastTimerValue: number = 0; // Track last timer value to prevent redundant updates
  private log: ReturnType<typeof createChildLogger>;

  // Question buffer system
  private readonly QUESTION_BUFFER_SIZE = 2; // Keep 2 questions ahead

  private usedPrompts: Set<string> = new Set();
  private currentRoundAnswer: string = "";
  // Acceptable answers are read from state.currentPrompt
  private geminiService: GeminiService;
  private questionDatabase: any; // Using any for now since both implementations have the same interface
  // Recent questions handled by QuestionBufferManager
  private questionBufferManager!: QuestionBufferManager;
  private promptLoader!: PromptLoader;
  private guessManager!: GuessManager;
  private roundManager!: RoundManager;

  onCreate(options: RoomOptions = {}) {
    // Initialize room-specific logger
    this.log = createChildLogger({ roomId: this.roomId });
    
    this.log.system("Creating trivia room", { 
      options: {
        targetScore: options.targetScore,
        roundTime: options.roundTime,
        maxPlayers: options.maxPlayers,
        isPrivate: options.isPrivate,
        topics: options.topics,
        difficulty: options.difficulty
      }
    });
    
    // Initialize Gemini service
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.log.error("GEMINI_API_KEY environment variable is not set!");
      throw new Error("Gemini API key is required");
    }
    this.geminiService = new GeminiService(apiKey);
    
    // Initialize question database
    this.questionDatabase = DatabaseFactory.getInstance();
    
    // Initialize room state
    this.state = new TriviaRoomState();
    this.state.targetScore = options.targetScore || this.DEFAULT_TARGET_SCORE;
    this.state.roundTime = options.roundTime || this.DEFAULT_ROUND_TIME;
    this.state.isPrivate = options.isPrivate || false;
    this.state.maxPlayers = options.maxPlayers || this.maxClients;
    this.state.roomName = options.roomName || "Trivia Room";
    this.state.topics = options.topics || [];
    this.state.currentTopic = this.state.topics[0] || "";
    this.state.currentTopicIndex = 0;
    this.state.currentDifficulty = options.difficulty || 3;
    
    // Generate and assign game pin with collision handling
    this.state.gamePin = this.pinGenerator.generateUniqueGamePin();
    this.log.game("Game pin assigned", { gamePin: this.state.gamePin });
    
    // Register room in the game pin registry with metadata
    const registry = GamePinRegistry.getInstance();
    registry.registerRoom(this.state.gamePin, this.roomId, {
      roomName: this.state.roomName,
      topics: this.state.topics,
      difficulty: this.state.currentDifficulty,
      playerCount: 0,
      maxPlayers: this.state.maxPlayers,
      isPrivate: this.state.isPrivate,
      gameStarted: false, // Keep for backwards compatibility with registry
      canStart: false
    });
    
    // Initialize managers
    this.questionBufferManager = new QuestionBufferManager({
      state: this.state,
      geminiService: this.geminiService,
      questionDatabase: this.questionDatabase,
      questionBufferSize: this.QUESTION_BUFFER_SIZE,
      logger: console.log,
    });
    this.promptLoader = new PromptLoader({
      state: this.state,
      getStaticPrompts: () => STATIC_PROMPTS,
      usedPrompts: this.usedPrompts,
    });
    this.registrySync = new RegistrySync(this.roomId, this.state);
    this.guessManager = new GuessManager(this.state);
    this.roundManager = new RoundManager(this.state);

    // Initialize feature managers
    this.chatManager = new ChatManager(this.state);
    this.settingsManager = new SettingsManager(
      this.state,
      () => { 
        // FIXED: Smart cleanup instead of nuclear resetRecents()
        // Only removes topics that are no longer active, preserves existing topic data
        this.questionBufferManager.cleanupStaleTopics(this.state.topics || []);
        this.questionBufferManager.clear(); 
      },
      () => this.updateRoomMetadata()
    );
    this.playerManager = new PlayerManager(
      this.state,
      () => this.resumeGame(),
      () => this.pauseGame(),
      () => this.disconnect(),
      this.ROOM_DISPOSE_DELAY
    );
    
    // Set up message handlers
    this.setupMessageHandlers();
    
    // Start the game loop
    this.startGameLoop();
  }

  async onAuth(client: Client, options: any, _req: any) { return this.playerManager.onAuth(client, options); }

  onJoin(client: Client, _options: any) {
    this.log.player("Player joined", { 
      playerId: client.sessionId,
      totalPlayers: this.state.players.size
    });
    
    this.playerManager.onJoin(client);
    this.updateRoomMetadata();
  }

  onLeave(client: Client, _consented: boolean) {
    this.log.player("Player left", { 
      playerId: client.sessionId,
      remainingPlayers: this.state.players.size - 1
    });
    
    this.playerManager.onLeave(client);
    this.updateRoomMetadata();
  }

  private updateRoomMetadata() {
    this.registrySync.update();
  }

  onDispose() {
    this.log.system("Disposing trivia room");
    
    // Remove room from game pin registry
    this.registrySync.remove();
    
    // Log cleanup analytics for debugging
    const analytics = this.questionBufferManager.getTopicAnalytics();
    this.log.system("Room disposal cleanup", {
      totalTopics: analytics.totalTopics,
      totalQuestions: analytics.totalQuestions,
      totalQueries: analytics.totalQueries
    });
    this.questionBufferManager.resetRecents(); // Clear all data on disposal
    
    // Clean up timers
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
    }
    if (this.gameLoopTimer) {
      clearInterval(this.gameLoopTimer);
    }
    if (this.restartTimer) {
      clearInterval(this.restartTimer);
    }
    if (this.disposeTimer) {
      clearTimeout(this.disposeTimer);
    }
    
    // Note: We don't close the database here since it's a singleton
    // that may be used by other rooms. It will be closed when the process exits.
  }

  private setupMessageHandlers() {
    // Handle playground message types (development only)
    this.onMessage("__playground_message_types", (_client, message) => {
      // Ignore playground messages in production
      if (process.env.NODE_ENV === "production") {
        return;
      }
      // Log playground message for debugging
      this.log.debug("Playground message received", { message });
    });

    // Handle player ready state
    this.onMessage(MSG.PLAYER_READY, (client, message: PlayerReadyMessage) => {
      if (typeof message?.ready === "boolean") {
        this.state.setPlayerReady(client.sessionId, message.ready);
        this.checkGameStart();
      }
    });

    // Handle guess submission
    this.onMessage(MSG.SUBMIT_GUESS, (client, message: GuessMessage) => {
      if (typeof message?.guess === "string") {
        const handled = this.guessManager.handleGuess(
          client.sessionId,
          message.guess,
          () => this.endRound(),
          (winnerId) => this.endGame(winnerId)
        );
        if (handled) {
          this.log.debug("Round guess processed", { 
            totalGuesses: this.state.roundGuesses.size,
            playerId: client.sessionId
          });
        }
      }
    });

    // Handle game start request
    this.onMessage(MSG.START_GAME, (client) => {
      this.log.game("Start game request received", { playerId: client.sessionId });
      
      if (client.sessionId !== this.state.hostId) {
        this.log.game("Start game rejected - not host", { 
          playerId: client.sessionId, 
          hostId: this.state.hostId 
        });
        return;
      }
      
      if (this.state.gameStatus === GameStatus.IN_PROGRESS) {
        this.log.game("Start game rejected - already in progress");
        return;
      }

      // Check if we have minimum players (no ready system - presence = readiness)
      const playerCount = this.state.players.size;
      if (playerCount >= 2) {
        this.log.game("Starting game", { playerCount });
        this.startGame().catch(error => {
          this.log.error("Failed to start game", error);
        });
      } else {
        this.log.game("Start game rejected - insufficient players", { 
          playerCount, 
          required: 2 
        });
      }
    });

    // Handle chat messages
    this.onMessage(MSG.CHAT, (client, message: ChatMessage) => {
      if (typeof message?.text === "string") {
        this.chatManager.handleChatMessage(client.sessionId, message.text);
      }
    });

    // Handle room settings update
    this.onMessage(MSG.UPDATE_SETTINGS, (client, message: SettingsMessage) => {
      if (client.sessionId === this.state.hostId) {
        this.settingsManager.updateRoomSettings(message);
      }
    });

    // Handle topic setting (host only)
    this.onMessage(MSG.SET_TOPIC, (client, message: TopicMessage) => {
      if (client.sessionId === this.state.hostId && typeof message?.topic === "string") {
        this.settingsManager.setTopic(message.topic);
      }
    });

    // Handle multiple topics setting (host only)
    this.onMessage(MSG.SET_TOPICS, (client, message: TopicsMessage) => {
      if (client.sessionId === this.state.hostId && Array.isArray(message?.topics)) {
        this.settingsManager.setTopics(message.topics);
      }
    });

    // Handle difficulty setting (host only)
    this.onMessage(MSG.SET_DIFFICULTY, (client, message: DifficultyMessage) => {
      if (client.sessionId === this.state.hostId && typeof message?.difficulty === "number") {
        this.settingsManager.setDifficulty(message.difficulty);
      }
    });

    // Handle join next game (JKLM-style restart system)
    this.onMessage(MSG.JOIN_NEXT_GAME, (client) => {
      // Only allow joining if we're in the game ended state with countdown active
      if (this.state.gameStatus === GameStatus.GAME_ENDED && this.state.restartCountdown > 0) {
        this.state.addParticipatingPlayer(client.sessionId);
        this.log.game("Player joined next game", { 
          playerId: client.sessionId,
          totalParticipating: this.state.getParticipatingPlayerCount()
        });
      }
    });
  }

  private startGameLoop() {
    // Game loop runs every 100ms for better performance vs 50ms
    this.gameLoopTimer = setInterval(() => {
      if (this.state.gameStatus === GameStatus.IN_PROGRESS && !this.state.gamePaused) {
        this.updateGameState();
      }
    }, this.GAME_LOOP_INTERVAL);
  }

  private updateGameState() {
    // Update round timer
    if (this.state.currentRound > 0 && this.state.roundStartTime > 0) {
      const elapsed = Date.now() - this.state.roundStartTime;
      const newTimerValue = Math.max(0, this.state.roundTime - elapsed);
      
      // Only update timer state if it has changed significantly (reduces network traffic)
      if (Math.abs(newTimerValue - this.lastTimerValue) >= this.TIMER_UPDATE_THRESHOLD || newTimerValue === 0) {
        this.state.roundTimeRemaining = newTimerValue;
        this.lastTimerValue = newTimerValue;
      }
      
      // Check if round should end (timer expired OR all players answered correctly)
      if (!this.state.roundEnded) {
        if (newTimerValue <= 0) {
          this.endRound();
        } else if (this.checkAllPlayersAnswered()) {
          this.endRound();
        }
      }
    }
  }

  private checkGameStart() {
    const readyPlayers = Array.from(this.state.players.values()).filter(p => p.ready);
    const canStart = readyPlayers.length >= 2 && this.state.gameStatus === GameStatus.WAITING;
    this.state.canStart = canStart;
  }

  private async startGame() {
    this.log.game("Game started", { playerCount: this.state.players.size });
    
    this.state.gameStatus = GameStatus.IN_PROGRESS;
    this.state.canStart = false;
    this.state.currentRound = 0;
    this.state.gamePaused = false;
    this.state.winnerId = "";
    
    // Reset all player scores for new game
    for (const player of this.state.players.values()) {
      player.score = 0;
    }
    
    // Update room metadata in registry
    this.updateRoomMetadata();
    
    // Pre-fill question buffer for smooth gameplay
    await this.questionBufferManager.preFillBuffer();
    
    // Start first round
    this.startNewRound().catch(error => {
      this.log.error("Failed to start new round", error);
    });
  }

  private async startNewRound(): Promise<void> {
    this.state.currentRound++;
    this.state.roundStartTime = 0; // Don't start timer yet - wait for questions to load
    this.state.roundTimeRemaining = this.state.roundTime;
    
    // Reset timer tracking for optimized updates
    this.lastTimerValue = this.state.roundTime;
    
    // Clear previous round's guesses and incorrect guesses
    this.state.clearRoundGuesses();
    this.state.clearIncorrectGuesses();
    
    // Clear correct guess order for new round (JKLM-style scoring)
    this.state.correctGuessOrder = [];
    
    // Load new prompt FIRST - this ensures new question is ready before clearing answer display
    await this.loadNewPrompt();
    
    // NOW clear the answer display state - no flash because new question is already loaded
    this.state.roundEnded = false;
    this.state.correctAnswer = "";
    
    // NOW start the timer after questions are ready and displayed
    this.state.roundStartTime = Date.now();
    this.roundManager.markRoundLoaded();
    
    this.log.game("Round started", { 
      round: this.state.currentRound,
      topic: this.state.currentTopic,
      question: this.state.currentPrompt.text
    });
  }

  /**
   * Get the next question from buffer or generate one if buffer is empty
   */
  private async getNextQuestion(): Promise<GeneratedQuestion | null> {
    return this.questionBufferManager.getNextQuestion();
  }

  private async loadNewPrompt(): Promise<void> {
    if (this.state.currentTopic === "__DEV__") {
      this.log.debug("Development mode active - loading static prompt");
      const { correctAnswer, acceptableAnswers } = this.promptLoader.loadStaticPrompt();
      this.currentRoundAnswer = correctAnswer;
      this.guessManager.setAnswerPayload(correctAnswer, acceptableAnswers);
      return;
    }

    const generatedQuestion = await this.getNextQuestion();
    if (generatedQuestion) {
      const { correctAnswer, acceptableAnswers } = this.promptLoader.loadGeneratedQuestion(generatedQuestion);
      this.currentRoundAnswer = correctAnswer;
      this.guessManager.setAnswerPayload(correctAnswer, acceptableAnswers);
      this.log.ai("Generated question loaded", {
        topic: this.state.currentTopic,
        question: generatedQuestion.question,
        answer: generatedQuestion.correctAnswer,
        difficulty: generatedQuestion.difficulty
      });
    } else {
      this.log.warn("Question generation failed, using static prompt", { topic: this.state.currentTopic });
      const { correctAnswer, acceptableAnswers } = this.promptLoader.loadStaticPrompt();
      this.currentRoundAnswer = correctAnswer;
      this.guessManager.setAnswerPayload(correctAnswer, acceptableAnswers);
    }
  }

  /**
   * Checks if all active players in the game have answered correctly.
   * Returns true if all players have submitted correct answers, false otherwise.
   * This enables JKLM-style round completion where rounds end early when everyone gets it right.
   */
  private checkAllPlayersAnswered(): boolean {
    // Get all active players (those who are in the game, not just lobby)
    const activePlayers = Array.from(this.state.players.values());
    
    if (activePlayers.length === 0) {
      return false;
    }
    
    // Check if every active player has a correct guess for this round
    for (const player of activePlayers) {
      const playerGuess = this.state.roundGuesses.get(player.id);
      
      // If player hasn't guessed yet, or their guess was incorrect, return false
      if (!playerGuess || !playerGuess.isCorrect) {
        return false;
      }
    }
    
    this.log.game("All players answered correctly", { 
      playerCount: activePlayers.length,
      round: this.state.currentRound
    });
    return true;
  }

  private endRound() {
    if (this.state.roundEnded) return;
    
    // Performance monitoring - track round completion
    const reason = this.state.roundTimeRemaining <= 0 ? "timer_expired" : "all_answered_correctly";
    this.roundManager.addRoundEndMetric(reason);
    
    this.log.game("Round ended", {
      round: this.state.currentRound,
      reason,
      correctAnswer: this.currentRoundAnswer,
      playerCount: this.state.players.size
    });
    
    this.state.roundEnded = true;
    this.state.roundTimeRemaining = 0;
    
    // Always set the correct answer when round ends so it displays regardless of how the round ended
    this.state.correctAnswer = this.currentRoundAnswer;
    
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
      setTimeout(async () => {
        if (this.state.gameStatus === GameStatus.IN_PROGRESS) {
          await this.startNewRound();
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
    this.state.gameStatus = GameStatus.GAME_ENDED;
    this.state.winnerId = winnerId;
    this.state.gamePaused = false;
    
    // Reset game state for next game
    this.state.currentRound = 0;
    this.state.roundStartTime = 0;
    this.state.roundTimeRemaining = 0;
    this.state.roundEnded = false;
    this.state.correctAnswer = "";
    
    // Clear round guesses and incorrect guesses
    this.state.clearRoundGuesses();
    this.state.clearIncorrectGuesses();
    
    // Clear correct guess order for next game
    this.state.correctGuessOrder = [];
    
    // Reset all player ready states but preserve scores for winner screen display
    for (const player of this.state.players.values()) {
      player.ready = false;
      // Don't reset scores here - they'll be reset when a new game starts
    }
    
    // Reset used prompts for next game
    this.usedPrompts.clear();
    this.currentRoundAnswer = "";
    
    // Clear any timers
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = undefined;
    }
    
    // Update room metadata in registry
    this.updateRoomMetadata();
    
        // Auto-restart system: Start 10-second countdown
    this.state.startRestartCountdown();
    this.startRestartCountdown();
   
    this.log.game("Game ended", { winnerId, playerCount: this.state.players.size });
  }

  private startRestartCountdown() {
    // Clear any existing restart timer
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
    }

    // Update countdown every second
    this.restartTimer = setInterval(() => {
      if (this.state.restartCountdown > 0) {
        this.state.restartCountdown--;
        this.log.debug("Restart countdown", { secondsRemaining: this.state.restartCountdown });
      } else {
        // Countdown finished - check if we can restart
        this.handleRestartCountdownComplete();
      }
    }, 1000);
  }

  private handleRestartCountdownComplete() {
    if (this.restartTimer) {
      clearInterval(this.restartTimer);
      this.restartTimer = undefined;
    }

    this.log.game("Restart countdown complete - returning to lobby");
    
    // Always return to lobby for host to configure and start new game
    this.returnToLobby();
  }

  private returnToLobby() {
    this.log.game("Returning to lobby", { playerCount: this.state.players.size });
    
    // FIXED: Periodic maintenance to prevent memory bloat
    // Trims oversized topic histories (>10 questions/queries per topic)
    // and removes any stale topics not in current active list
    this.questionBufferManager.performMaintenance(this.state.topics || []);
    
    // Keep all players but reset their scores and ready states for new game
    for (const player of this.state.players.values()) {
      player.score = 0;
      player.ready = false; // Reset ready state for lobby
    }

    // Clear restart system
    this.state.clearRestartSystem();
    
    // Reset game state to initial lobby state
    this.state.gameStatus = GameStatus.WAITING;
    this.state.winnerId = "";
    this.state.gamePaused = false;
    this.state.canStart = this.state.players.size >= 2; // Can start if enough players
    this.state.currentRound = 0;
    
    // Preserve existing host if they're still in the room, otherwise assign new host
    if (this.state.hostId && !this.state.players.has(this.state.hostId)) {
      // Current host is no longer in room, assign new host
      if (this.state.players.size > 0) {
        const newHostId = Array.from(this.state.players.keys())[0];
        this.state.setHost(newHostId);
        this.log.game("Host reassigned - previous host left", { newHostId });
      } else {
        this.state.hostId = "";
        this.log.game("No players remaining - cleared host");
      }
    } else if (this.state.hostId) {
      this.log.debug("Preserved existing host", { hostId: this.state.hostId });
    } else if (this.state.players.size > 0) {
      // No host assigned but players exist, assign first player as host
      const newHostId = Array.from(this.state.players.keys())[0];
      this.state.setHost(newHostId);
      this.log.game("Host assigned to first player", { newHostId });
    }
  }

  private pauseGame() {
    this.state.gamePaused = true;
    
    // Clear any active timers
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = undefined;
    }
  }

  private resumeGame() {
    if (!this.state.gamePaused || this.state.gameStatus !== GameStatus.IN_PROGRESS) {
      return;
    }

    this.state.gamePaused = false;
    
    // If we're in the middle of a round, restart the round timer
    if (this.state.currentRound > 0 && !this.state.roundEnded) {
      // Reset round timer based on remaining time
      if (this.state.roundTimeRemaining > 0) {
        this.state.roundStartTime = Date.now() - (this.state.roundTime - this.state.roundTimeRemaining);
      } else {
        // If no time remaining, start a new round
        this.startNewRound();
      }
    }
  }

  /**
   * Get performance metrics for monitoring and debugging.
   * Returns round transition metrics including duration, completion reason, and player count.
   */
  getPerformanceMetrics() {
    const metrics = this.roundManager.getMetrics();
    return {
      recentRounds: metrics.recentRounds,
      averageRoundDuration: metrics.averageRoundDuration,
      currentPlayers: this.state.players.size,
      gameLoopInterval: this.GAME_LOOP_INTERVAL,
      timerUpdateThreshold: this.TIMER_UPDATE_THRESHOLD
    };
  }
}