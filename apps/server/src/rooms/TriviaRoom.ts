import { Room, Client } from "@colyseus/core";
import { TriviaRoomState } from "./schema/TriviaRoomState";
import { MSG, TopicMessage, DifficultyMessage } from "@shared/index";
import { GeminiService } from "../services/GeminiService";
import { GamePinRegistry } from "../services/GamePinRegistry";

export interface RoomOptions {
  targetScore?: number;
  roundTime?: number;
  maxPlayers?: number;
  isPrivate?: boolean;
  topic?: string;
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

interface StaticPrompt {
  id: string;
  text: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  answer: string;
}

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
  private lastTimerValue: number = 0; // Track last timer value to prevent redundant updates
  
  // Performance monitoring
  private roundStartTimestamp: number = 0;
  private roundTransitionMetrics: { duration: number; reason: string; playerCount: number; }[] = [];

  // Static prompt database
  private static readonly PROMPTS: StaticPrompt[] = [
    // Geography
    { id: "geo_1", text: "What is the capital of France?", category: "Geography", difficulty: "easy", answer: "Paris" },
    { id: "geo_2", text: "What is the largest country in the world by land area?", category: "Geography", difficulty: "easy", answer: "Russia" },
    { id: "geo_3", text: "What is the capital of Japan?", category: "Geography", difficulty: "easy", answer: "Tokyo" },
    { id: "geo_4", text: "What is the longest river in the world?", category: "Geography", difficulty: "medium", answer: "Nile" },
    { id: "geo_5", text: "What is the highest mountain in the world?", category: "Geography", difficulty: "easy", answer: "Mount Everest" },
    { id: "geo_6", text: "What is the capital of Australia?", category: "Geography", difficulty: "medium", answer: "Canberra" },
    { id: "geo_7", text: "What is the largest desert in the world?", category: "Geography", difficulty: "medium", answer: "Sahara" },
    { id: "geo_8", text: "What is the capital of Brazil?", category: "Geography", difficulty: "medium", answer: "Brasília" },
    
    // History
    { id: "hist_1", text: "In what year did World War II end?", category: "History", difficulty: "easy", answer: "1945" },
    { id: "hist_2", text: "Who was the first President of the United States?", category: "History", difficulty: "easy", answer: "George Washington" },
    { id: "hist_3", text: "In what year did Columbus discover America?", category: "History", difficulty: "medium", answer: "1492" },
    { id: "hist_4", text: "What ancient wonder was located in Alexandria?", category: "History", difficulty: "hard", answer: "Lighthouse" },
    { id: "hist_5", text: "Who was the first Emperor of Rome?", category: "History", difficulty: "medium", answer: "Augustus" },
    { id: "hist_6", text: "In what year did the Berlin Wall fall?", category: "History", difficulty: "medium", answer: "1989" },
    { id: "hist_7", text: "Who was the first woman to win a Nobel Prize?", category: "History", difficulty: "hard", answer: "Marie Curie" },
    { id: "hist_8", text: "What year did the Titanic sink?", category: "History", difficulty: "medium", answer: "1912" },
    
    // Pop Culture
    { id: "pop_1", text: "What is the name of the main character in the movie 'Titanic'?", category: "Pop Culture", difficulty: "easy", answer: "Jack" },
    { id: "pop_2", text: "Who played Iron Man in the Marvel Cinematic Universe?", category: "Pop Culture", difficulty: "easy", answer: "Robert Downey Jr" },
    { id: "pop_3", text: "What is the name of the fictional town where 'The Simpsons' live?", category: "Pop Culture", difficulty: "medium", answer: "Springfield" },
    { id: "pop_4", text: "What year did the first iPhone come out?", category: "Pop Culture", difficulty: "medium", answer: "2007" },
    { id: "pop_5", text: "Who is the lead singer of Queen?", category: "Pop Culture", difficulty: "easy", answer: "Freddie Mercury" },
    { id: "pop_6", text: "What is the name of the main character in 'Breaking Bad'?", category: "Pop Culture", difficulty: "medium", answer: "Walter White" },
    { id: "pop_7", text: "What is the name of the fictional school in 'Harry Potter'?", category: "Pop Culture", difficulty: "easy", answer: "Hogwarts" },
    { id: "pop_8", text: "Who created the TV show 'The Office' (US version)?", category: "Pop Culture", difficulty: "hard", answer: "Greg Daniels" },
    
    // Science
    { id: "sci_1", text: "What is the chemical symbol for gold?", category: "Science", difficulty: "easy", answer: "Au" },
    { id: "sci_2", text: "What is the hardest natural substance on Earth?", category: "Science", difficulty: "medium", answer: "Diamond" },
    { id: "sci_3", text: "What is the largest planet in our solar system?", category: "Science", difficulty: "easy", answer: "Jupiter" },
    { id: "sci_4", text: "What is the atomic number of carbon?", category: "Science", difficulty: "medium", answer: "6" },
    { id: "sci_5", text: "What is the speed of light in miles per second?", category: "Science", difficulty: "hard", answer: "186282" },
    { id: "sci_6", text: "What is the name of the force that keeps planets in orbit?", category: "Science", difficulty: "easy", answer: "Gravity" },
    { id: "sci_7", text: "What is the chemical formula for water?", category: "Science", difficulty: "easy", answer: "H2O" },
    { id: "sci_8", text: "What is the largest organ in the human body?", category: "Science", difficulty: "medium", answer: "Skin" },
    
    // Sports
    { id: "sport_1", text: "What country has won the most FIFA World Cups?", category: "Sports", difficulty: "medium", answer: "Brazil" },
    { id: "sport_2", text: "What is the national sport of Japan?", category: "Sports", difficulty: "hard", answer: "Sumo" },
    { id: "sport_3", text: "How many players are on a basketball court at once?", category: "Sports", difficulty: "easy", answer: "10" },
    { id: "sport_4", text: "What is the name of the trophy awarded to the winner of the Super Bowl?", category: "Sports", difficulty: "medium", answer: "Vince Lombardi Trophy" },
    { id: "sport_5", text: "What year did the first modern Olympic Games take place?", category: "Sports", difficulty: "medium", answer: "1896" },
    { id: "sport_6", text: "What is the most popular sport in the world?", category: "Sports", difficulty: "easy", answer: "Soccer" },
    { id: "sport_7", text: "How many Grand Slam tennis tournaments are there?", category: "Sports", difficulty: "medium", answer: "4" },
    { id: "sport_8", text: "What is the nickname of the New York Yankees?", category: "Sports", difficulty: "hard", answer: "The Bronx Bombers" }
  ];

  private usedPrompts: Set<string> = new Set();
  private currentRoundAnswer: string = "";
  private currentAcceptableAnswers: string[] = [];
  private geminiService: GeminiService;
  private recentQuestions: string[] = []; // Track recent questions to avoid duplicates

  onCreate(options: RoomOptions = {}) {
    console.log("Creating TriviaRoom:", this.roomId);
    
    // Initialize Gemini service
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY environment variable is not set!");
      throw new Error("Gemini API key is required");
    }
    this.geminiService = new GeminiService(apiKey);
    
    // Initialize room state
    this.state = new TriviaRoomState();
    this.state.targetScore = options.targetScore || this.DEFAULT_TARGET_SCORE;
    this.state.roundTime = options.roundTime || this.DEFAULT_ROUND_TIME;
    this.state.isPrivate = options.isPrivate || false;
    this.state.maxPlayers = options.maxPlayers || this.maxClients;
    this.state.currentTopic = options.topic || "General Knowledge"; // Use provided topic or default
    this.state.currentDifficulty = options.difficulty || 5; // Use provided difficulty or default
    
    // Generate and assign game pin with collision handling
    this.state.gamePin = this.generateUniqueGamePin();
    console.log(`🎯 Room ${this.roomId} created with game pin: ${this.state.gamePin}`);
    
    // Register room in the game pin registry with metadata
    const registry = GamePinRegistry.getInstance();
    registry.registerRoom(this.state.gamePin, this.roomId, {
      topic: this.state.currentTopic,
      difficulty: this.state.currentDifficulty,
      playerCount: 0,
      maxPlayers: this.state.maxPlayers,
      isPrivate: this.state.isPrivate,
      gameStarted: false,
      canStart: false
    });
    
    // Set up message handlers
    this.setupMessageHandlers();
    
    // Start the game loop
    this.startGameLoop();
  }

  async onAuth(client: Client, options: any, req: any) {
    // Add player to state before join
    this.state.addPlayer(client.sessionId, options.playerName || `Player ${client.sessionId.slice(0, 6)}`);
    return true;
  }

  onJoin(client: Client, options: any) {
    console.log(`Player ${client.sessionId} joined - Total players: ${this.state.players.size}`);
    
    // Clear dispose timer if it exists (player rejoined)
    if (this.disposeTimer) {
      clearTimeout(this.disposeTimer);
      this.disposeTimer = undefined;
    }
    
    // If there's no host yet, make this player the host
    if (!this.state.hostId) {
      this.state.setHost(client.sessionId);
    }

    // If we have enough players and game hasn't started, allow starting
    if (this.state.players.size >= 2 && !this.state.gameStarted) {
      this.state.canStart = true;
    }

    // Resume paused game if we now have enough players
    if (this.state.players.size >= 2 && this.state.gameStarted && this.state.gamePaused) {
      this.resumeGame();
    }

    // Update room metadata in registry
    this.updateRoomMetadata();
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`Player ${client.sessionId} left - Remaining: ${this.state.players.size - 1}`);
    
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
    
    // Update room metadata in registry
    this.updateRoomMetadata();
    
    // If room is empty, schedule disposal with delay
    if (this.state.players.size === 0) {
      this.disposeTimer = setTimeout(() => {
        this.disconnect();
      }, this.ROOM_DISPOSE_DELAY);
    } else {
      // Clear dispose timer if players are still in the room
      if (this.disposeTimer) {
        clearTimeout(this.disposeTimer);
        this.disposeTimer = undefined;
      }
    }
  }

  /**
   * Update room metadata in the registry with current room state
   */
  private updateRoomMetadata() {
    const registry = GamePinRegistry.getInstance();
    registry.updateRoomMetadata(this.roomId, {
      topic: this.state.currentTopic,
      difficulty: this.state.currentDifficulty,
      playerCount: this.state.players.size,
      maxPlayers: this.state.maxPlayers,
      isPrivate: this.state.isPrivate,
      gameStarted: this.state.gameStarted,
      canStart: this.state.canStart
    });
  }

  onDispose() {
    console.log(`Disposing TriviaRoom: ${this.roomId}`);
    
    // Remove room from game pin registry
    const registry = GamePinRegistry.getInstance();
    registry.removeRoomById(this.roomId);
    
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
  }

  private setupMessageHandlers() {
    // Handle playground message types (development only)
    this.onMessage("__playground_message_types", (client, message) => {
      // Ignore playground messages in production
      if (process.env.NODE_ENV === "production") {
        return;
      }
      // Log playground message for debugging
      console.log("Playground message received:", message);
    });

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

      // Only start if we have at least 2 ready players
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

    // Handle topic setting (host only)
    this.onMessage(MSG.SET_TOPIC, (client, message: TopicMessage) => {
      if (client.sessionId === this.state.hostId && typeof message?.topic === "string") {
        this.setTopic(message.topic);
      }
    });

    // Handle difficulty setting (host only)
    this.onMessage(MSG.SET_DIFFICULTY, (client, message: DifficultyMessage) => {
      if (client.sessionId === this.state.hostId && typeof message?.difficulty === "number") {
        this.setDifficulty(message.difficulty);
      }
    });

    // Handle join next game (JKLM-style restart system)
    this.onMessage(MSG.JOIN_NEXT_GAME, (client) => {
      // Only allow joining if we're in the game ended state with countdown active
      if (this.state.gameEnded && this.state.restartCountdown > 0) {
        this.state.addParticipatingPlayer(client.sessionId);
        console.log(`🎮 Player ${client.sessionId} joined next game (${this.state.getParticipatingPlayerCount()} total)`);
      }
    });
  }

  private startGameLoop() {
    // Game loop runs every 100ms for better performance vs 50ms
    this.gameLoopTimer = setInterval(() => {
      if (this.state.gameStarted && !this.state.gamePaused) {
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
    const canStart = readyPlayers.length >= 2 && !this.state.gameStarted;
    this.state.canStart = canStart;
  }

  private startGame() {
    console.log(`🎮 Starting game in room ${this.roomId}`);
    
    this.state.gameStarted = true;
    this.state.canStart = false;
    this.state.currentRound = 0;
    this.state.gamePaused = false;
    this.state.gameEnded = false;
    this.state.winnerId = "";
    
    // Reset all player scores for new game
    for (const player of this.state.players.values()) {
      player.score = 0;
    }
    
    // Update room metadata in registry
    this.updateRoomMetadata();
    
    // Start first round
    this.startNewRound().catch(error => {
      console.error("Failed to start new round:", error);
    });
  }

  private async startNewRound(): Promise<void> {
    this.state.currentRound++;
    this.state.roundStartTime = Date.now();
    this.state.roundTimeRemaining = this.state.roundTime;
    this.state.roundEnded = false;
    this.state.correctAnswer = "";
    
    // Reset timer tracking for optimized updates
    this.lastTimerValue = this.state.roundTime;
    
    // Performance monitoring - track round start
    this.roundStartTimestamp = Date.now();
    
    // Clear previous round's guesses and incorrect guesses
    this.state.clearRoundGuesses();
    this.state.clearIncorrectGuesses();
    
    // Clear correct guess order for new round (JKLM-style scoring)
    this.state.correctGuessOrder = [];
    
    // Load new prompt (now async)
    await this.loadNewPrompt();
    
    console.log(`📝 Round ${this.state.currentRound}: ${this.state.currentPrompt.text}`);
  }

  private async loadNewPrompt(): Promise<void> {
    if (this.state.currentTopic === "__DEV__") {
      console.log("⚙️ Development mode active. Loading static prompt.");
      this.loadStaticPrompt();
      return;
    }

    try {
      // Use Gemini API to generate a new question
      const questionRequest = {
        topic: this.state.currentTopic || "General Knowledge",
        difficulty: this.state.currentDifficulty || 5,
        previousQuestions: this.recentQuestions
      };

      console.log(`🤖 Generating question for "${questionRequest.topic}" (difficulty: ${questionRequest.difficulty}/10)`);
      
      const generatedQuestion = await this.geminiService.generateQuestion(questionRequest);
      
      // Update state with the generated question
      this.state.currentPrompt.id = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.state.currentPrompt.text = generatedQuestion.question;
      this.state.currentPrompt.category = generatedQuestion.category;
      this.state.currentPrompt.difficulty = this.mapDifficultyToString(generatedQuestion.difficulty);
      this.state.currentPrompt.topic = questionRequest.topic;
      this.state.currentPrompt.difficultyLevel = generatedQuestion.difficulty;
      this.state.currentPrompt.acceptableAnswers = generatedQuestion.acceptableAnswers;
      
      // Store the correct answer and acceptable answers for this round
      this.currentRoundAnswer = generatedQuestion.correctAnswer;
      this.currentAcceptableAnswers = generatedQuestion.acceptableAnswers;
      
      // Track recent questions to avoid duplicates
      this.recentQuestions.push(generatedQuestion.question);
      if (this.recentQuestions.length > 10) {
        this.recentQuestions.shift(); // Keep only the last 10 questions
      }
      
      console.log(`📝 Generated: "${generatedQuestion.question}" (Answer: ${generatedQuestion.correctAnswer})`);
      
    } catch (error) {
      console.error("Failed to generate question with Gemini API:", error);
      
      // Fallback to static prompts if AI generation fails
      console.log("🔄 Falling back to static prompts...");
      this.loadStaticPrompt();
    }
  }

  private loadStaticPrompt(): void {
    // Fallback method using static prompts
    const availablePrompts = TriviaRoom.PROMPTS.filter(prompt => !this.usedPrompts.has(prompt.id));
    
    if (availablePrompts.length === 0) {
      this.usedPrompts.clear();
      availablePrompts.push(...TriviaRoom.PROMPTS);
    }
    
    const selectedPrompt = availablePrompts[Math.floor(Math.random() * availablePrompts.length)];
    this.usedPrompts.add(selectedPrompt.id);
    
    this.state.currentPrompt.id = selectedPrompt.id;
    this.state.currentPrompt.text = selectedPrompt.text;
    this.state.currentPrompt.category = selectedPrompt.category;
    this.state.currentPrompt.difficulty = selectedPrompt.difficulty;
    this.state.currentPrompt.topic = "Mixed Topics";
    this.state.currentPrompt.difficultyLevel = this.mapStringToNumber(selectedPrompt.difficulty);
    this.state.currentPrompt.acceptableAnswers = [selectedPrompt.answer];
    
    this.currentRoundAnswer = selectedPrompt.answer;
    this.currentAcceptableAnswers = [selectedPrompt.answer];
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

    // Check if guess is correct using enhanced answer matching
    const isCorrect = GeminiService.isAnswerAcceptable(guess, this.currentAcceptableAnswers);
    
    if (isCorrect) {
      // Remove any previous incorrect guess since they got it right
      this.state.removeIncorrectGuess(playerId);
      
      // Record the correct guess
      this.state.addGuess(playerId, guess, isCorrect);
      
      // 🔍 DEBUG: Log for purple highlighting issue
      console.log(`✅ ${playerId} guessed correctly: "${guess}"`);
      console.log(`📊 roundGuesses now has ${this.state.roundGuesses.size} entries`);
      
      this.handleCorrectGuess(playerId);
    } else {
      // Track this incorrect guess for live display
      this.state.addIncorrectGuess(playerId, guess.trim());
      
      // Note: We don't add incorrect guesses to roundGuesses yet
      // This allows multiple attempts until they get it right or the round ends
      console.log(`❌ ${playerId} guessed incorrectly: "${guess.trim()}"`);
    }
  }

  private handleCorrectGuess(playerId: string) {
    // Add player to correct guess order
    this.state.correctGuessOrder.push(playerId);
    const position = this.state.correctGuessOrder.length - 1; // 0-based position
    
    // Calculate base rank score
    let baseScore: number;
    if (position === 0) {
      // First player always gets 10 points
      baseScore = 10;
    } else {
      // Subsequent players: 9, 8, 7, ... down to minimum of 1
      baseScore = Math.max(1, 10 - position);
    }
    
    // Calculate time multiplier for non-first players
    let finalScore: number;
    if (position === 0) {
      // First player always gets full base score regardless of time
      finalScore = baseScore;
    } else {
      // Apply time multiplier to subsequent players
      const elapsed = Date.now() - this.state.roundStartTime;
      const remainingTime = this.state.roundTime - elapsed;
      const timeRatio = remainingTime / this.state.roundTime;
      
      // Combine base score with time multiplier, ensure minimum of 1 point
      finalScore = Math.max(1, Math.round(baseScore * timeRatio));
    }
    
    console.log(`🎯 Player ${playerId} scored ${finalScore} points (position: ${position + 1}, base: ${baseScore})`);
    
    // Award points
    this.state.addScore(playerId, finalScore);
    
    // Check for game winner immediately
    const winner = this.checkForWinner();
    if (winner) {
      this.endGame(winner);
      return;
    }
    
    // Check if all active players have answered correctly
    if (this.checkAllPlayersAnswered()) {
      console.log("All players have answered correctly, ending round early");
      this.endRound();
    }
    // Otherwise, let the round continue until timer expires
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
    
    console.log(`🎯 All ${activePlayers.length} players answered correctly!`);
    return true;
  }

  private endRound() {
    if (this.state.roundEnded) return;
    
    // Performance monitoring - track round completion
    const roundDuration = Date.now() - this.roundStartTimestamp;
    const playerCount = this.state.players.size;
    const reason = this.state.roundTimeRemaining <= 0 ? "timer_expired" : "all_answered_correctly";
    
    this.roundTransitionMetrics.push({
      duration: roundDuration,
      reason: reason,
      playerCount: playerCount
    });
    
    // Keep only last 10 rounds of metrics to prevent memory bloat
    if (this.roundTransitionMetrics.length > 10) {
      this.roundTransitionMetrics.shift();
    }
    
    console.log(`🏁 Round ${this.state.currentRound} ended (${reason}) - Answer: "${this.currentRoundAnswer}"`);
    
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
        if (this.state.gameStarted && !this.state.gameEnded) {
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
    this.state.gameEnded = true;
    this.state.winnerId = winnerId;
    this.state.gameStarted = false;
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
    
    // JKLM-style restart system: Start 15-second countdown
    this.state.startRestartCountdown();
    this.startRestartCountdown();
    
    console.log(`🏆 Game ended - Winner: ${winnerId} | Starting 15s restart countdown`);
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
        console.log(`⏰ Restart countdown: ${this.state.restartCountdown}s remaining`);
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

    const participatingCount = this.state.getParticipatingPlayerCount();
    console.log(`⏰ Restart countdown complete - ${participatingCount} players want to play again`);

    if (participatingCount >= 2) {
      // Enough players to start a new game
      this.restartGame();
    } else {
      // Not enough players - return to lobby
      this.returnToLobby();
    }
  }

  private restartGame() {
    console.log(`🔄 Restarting game with ${this.state.getParticipatingPlayerCount()} players`);
    
    // Get participating player IDs
    const participatingPlayerIds = this.state.getParticipatingPlayerIds();
    
    // Disconnect non-participating players
    for (const [playerId, player] of this.state.players) {
      if (!this.state.participatingPlayers.has(playerId)) {
        console.log(`👋 Disconnecting non-participating player: ${player.name} (${playerId})`);
        // Find the client and disconnect them
        const client = this.clients.find(c => c.sessionId === playerId);
        if (client) {
          client.leave(1000, "Did not join next game"); // Graceful disconnect with reason
        }
      } else {
        // Reset scores and set as ready for participating players
        player.score = 0;
        player.ready = true;
      }
    }

    // Clear restart system
    this.state.clearRestartSystem();
    
    // Don't reset gameEnded yet - keep it true to avoid showing lobby
    // We'll reset it atomically when we start the new game
    this.state.winnerId = "";
    this.state.canStart = true;

    // Start the new game immediately - no delay needed since players already confirmed
    this.startGame();
  }

  private returnToLobby() {
    console.log(`🏠 Returning to lobby - not enough players to restart`);
    
    // Disconnect all players since not enough want to continue
    // This provides a clean slate for new players to join
    for (const [playerId, player] of this.state.players) {
      console.log(`👋 Disconnecting player: ${player.name} (${playerId}) - insufficient players for restart`);
      const client = this.clients.find(c => c.sessionId === playerId);
      if (client) {
        client.leave(1000, "Not enough players for next game"); // Graceful disconnect with reason
      }
    }

    // Clear restart system
    this.state.clearRestartSystem();
    
    // Reset game state to initial lobby state
    this.state.gameEnded = false;
    this.state.winnerId = "";
    this.state.gameStarted = false;
    this.state.gamePaused = false;
    this.state.canStart = false;
    this.state.currentRound = 0;
    this.state.hostId = "";
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
    if (!this.state.gamePaused || !this.state.gameStarted) {
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

  /**
   * Get performance metrics for monitoring and debugging.
   * Returns round transition metrics including duration, completion reason, and player count.
   */
  getPerformanceMetrics() {
    const avgDuration = this.roundTransitionMetrics.length > 0 
      ? this.roundTransitionMetrics.reduce((sum, m) => sum + m.duration, 0) / this.roundTransitionMetrics.length 
      : 0;
      
    return {
      recentRounds: this.roundTransitionMetrics,
      averageRoundDuration: Math.round(avgDuration),
      currentPlayers: this.state.players.size,
      gameLoopInterval: this.GAME_LOOP_INTERVAL,
      timerUpdateThreshold: this.TIMER_UPDATE_THRESHOLD
    };
  }

  /**
   * Set the topic for AI question generation (host only)
   */
  private setTopic(topic: string): void {
    if (topic && topic.trim().length > 0) {
      this.state.currentTopic = topic.trim();
      console.log(`🎯 Topic set to: "${this.state.currentTopic}"`);
      
      // Clear recent questions when topic changes to allow fresh questions
      this.recentQuestions = [];
      
      // Update room metadata in registry
      this.updateRoomMetadata();
    }
  }

  /**
   * Set the difficulty level for AI question generation (host only)
   */
  private setDifficulty(difficulty: number): void {
    if (difficulty >= 1 && difficulty <= 10) {
      this.state.currentDifficulty = difficulty;
      console.log(`📊 Difficulty set to: ${this.state.currentDifficulty}/10`);
      
      // Update room metadata in registry
      this.updateRoomMetadata();
    }
  }

  /**
   * Map numeric difficulty (1-10) to string representation
   */
  private mapDifficultyToString(difficulty: number): string {
    if (difficulty <= 2) return "easy";
    if (difficulty <= 6) return "medium";
    return "hard";
  }

  /**
   * Map string difficulty to numeric representation
   */
  private mapStringToNumber(difficulty: string): number {
    switch (difficulty.toLowerCase()) {
      case "easy": return 3;
      case "medium": return 5;
      case "hard": return 8;
      default: return 5;
    }
  }

  /**
   * Generate a unique 5-character alphanumeric game pin with collision detection
   */
  private generateUniqueGamePin(): string {
    const registry = GamePinRegistry.getInstance();
    const maxAttempts = 10;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const gamePin = this.generateGamePin();
      
      if (!registry.isPinInUse(gamePin)) {
        return gamePin;
      }
      
      console.warn(`⚠️ Game pin collision on attempt ${attempt}: ${gamePin} already in use`);
    }
    
    // If we still have collisions after max attempts, append timestamp for uniqueness
    const fallbackPin = this.generateGamePin() + Date.now().toString().slice(-1);
    console.warn(`🚨 Using fallback pin after ${maxAttempts} collisions: ${fallbackPin}`);
    return fallbackPin.substring(0, 5); // Ensure 5 characters
  }

  /**
   * Generate a 5-character alphanumeric game pin
   */
  private generateGamePin(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let gamePin = '';
    for (let i = 0; i < 5; i++) {
      gamePin += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return gamePin;
  }
}