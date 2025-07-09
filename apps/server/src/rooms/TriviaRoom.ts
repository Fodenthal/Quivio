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
  private readonly DEFAULT_TARGET_SCORE = 100;
  private readonly DEFAULT_ROUND_TIME = 30000; // 30 seconds
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

  async onAuth(client: Client, options: any, req: any) {
    // Add player to state before join
    console.log('onAuth called for', client.sessionId, 'with options:', options);
    this.state.addPlayer(client.sessionId, options.playerName || `Player ${client.sessionId.slice(0, 6)}`);
    console.log('State after addPlayer - Players size:', this.state.players.size);
    console.log('Current players:', Array.from(this.state.players.keys()));
    return true;
  }

  onJoin(client: Client, options: any) {
    console.log(`Player ${client.sessionId} joined room ${this.roomId} - Total players: ${this.state.players.size}`);
    console.log('Current host ID:', this.state.hostId);
    console.log('All players:', Array.from(this.state.players.keys()));
    
    // Clear dispose timer if it exists (player rejoined)
    if (this.disposeTimer) {
      clearTimeout(this.disposeTimer);
      this.disposeTimer = undefined;
      console.log('Cleared room disposal timer - player joined');
    }
    
    // If there's no host yet, make this player the host
    if (!this.state.hostId) {
      this.state.setHost(client.sessionId);
      console.log(`Set ${client.sessionId} as host`);
    }

    // If we have enough players and game hasn't started, allow starting
    if (this.state.players.size >= 2 && !this.state.gameStarted) {
      this.state.canStart = true;
      console.log('Game can now start');
    }

    // Resume paused game if we now have enough players
    if (this.state.players.size >= 2 && this.state.gameStarted && this.state.gamePaused) {
      this.resumeGame();
      console.log('Resumed paused game - sufficient players joined');
    }
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`Player ${client.sessionId} left room ${this.roomId} (consented: ${consented})`);
    console.log('Players before removal:', Array.from(this.state.players.keys()));
    console.log('Current host ID:', this.state.hostId);
    
    // Remove player from state
    this.state.removePlayer(client.sessionId);
    
    console.log('Players after removal:', Array.from(this.state.players.keys()));
    console.log('Players size after removal:', this.state.players.size);
    
    // If host left, assign new host
    if (this.state.hostId === client.sessionId && this.state.players.size > 0) {
      const newHostId = Array.from(this.state.players.keys())[0];
      this.state.setHost(newHostId);
      console.log(`Host left, assigned new host: ${newHostId}`);
    }
    
    // If not enough players, pause game
    if (this.state.players.size < 2 && this.state.gameStarted) {
      this.pauseGame();
      console.log('Game paused due to insufficient players');
    }
    
    // Update can start status
    this.state.canStart = this.state.players.size >= 2 && !this.state.gameStarted;
    console.log('Can start updated:', this.state.canStart);
    
    // If room is empty, schedule disposal with delay
    if (this.state.players.size === 0) {
      console.log('Room is empty, scheduling disposal in 60 seconds');
      this.disposeTimer = setTimeout(() => {
        console.log('Disposing empty room after delay');
        this.disconnect();
      }, this.ROOM_DISPOSE_DELAY);
    } else {
      // Clear dispose timer if players are still in the room
      if (this.disposeTimer) {
        clearTimeout(this.disposeTimer);
        this.disposeTimer = undefined;
        console.log('Cleared room disposal timer - players still in room');
      }
    }
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
      console.log(`Received player_ready message from ${client.sessionId}:`, message);
      // ✅ Ignore malformed payloads
      if (typeof message?.ready === "boolean") {
        console.log(`Setting player ${client.sessionId} ready state to: ${message.ready}`);
        this.state.setPlayerReady(client.sessionId, message.ready);
        this.checkGameStart();
        console.log(`Updated ready state. Can start: ${this.state.canStart}`);
      } else {
        console.log(`Invalid player_ready message from ${client.sessionId}:`, message);
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
          console.log("Round ending due to timer expiration");
          this.endRound();
        } else if (this.checkAllPlayersAnswered()) {
          console.log("Round ending because all players answered correctly");
          this.endRound();
        }
      }
    }
  }

  private checkGameStart() {
    const readyPlayers = Array.from(this.state.players.values()).filter(p => p.ready);
    const canStart = readyPlayers.length >= 2 && !this.state.gameStarted;
    console.log(`checkGameStart: ${readyPlayers.length} ready players, ${this.state.players.size} total players, gameStarted: ${this.state.gameStarted}, canStart: ${canStart}`);
    this.state.canStart = canStart;
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
    
    // Reset timer tracking for optimized updates
    this.lastTimerValue = this.state.roundTime;
    
    // Performance monitoring - track round start
    this.roundStartTimestamp = Date.now();
    
    // Clear previous round's guesses
    this.state.clearRoundGuesses();
    
    // Load new prompt
    this.loadNewPrompt();
    
    console.log(`Started round ${this.state.currentRound} in room ${this.roomId}`);
  }

  private loadNewPrompt() {
    // Get available prompts (not used yet)
    const availablePrompts = TriviaRoom.PROMPTS.filter(prompt => !this.usedPrompts.has(prompt.id));
    
    // If all prompts have been used, reset the used prompts set
    if (availablePrompts.length === 0) {
      this.usedPrompts.clear();
      availablePrompts.push(...TriviaRoom.PROMPTS);
    }
    
    // Randomly select a prompt
    const selectedPrompt = availablePrompts[Math.floor(Math.random() * availablePrompts.length)];
    
    // Mark prompt as used
    this.usedPrompts.add(selectedPrompt.id);
    
    // Update state with the selected prompt
    this.state.currentPrompt.id = selectedPrompt.id;
    this.state.currentPrompt.text = selectedPrompt.text;
    this.state.currentPrompt.category = selectedPrompt.category;
    this.state.currentPrompt.difficulty = selectedPrompt.difficulty;
    
    // Store the correct answer for this round
    this.currentRoundAnswer = selectedPrompt.answer;
    
    console.log(`Loaded prompt: ${selectedPrompt.text} (Answer: ${selectedPrompt.answer})`);
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
    const correctAnswer = this.normalizeAnswer(this.currentRoundAnswer);
    
    // Check if guess is correct
    const isCorrect = normalizedGuess === correctAnswer;
    
    // Record the guess
    this.state.addGuess(playerId, guess, isCorrect);
    
    if (isCorrect) {
      this.handleCorrectGuess(playerId);
    }
  }

  private handleCorrectGuess(playerId: string) {
    // Calculate score based on time (base 10 points + time bonus up to 10 more)
    const elapsed = Date.now() - this.state.roundStartTime;
    const remainingTime = this.state.roundTime - elapsed;
    const timeBonus = Math.max(0, Math.floor((remainingTime / this.state.roundTime) * 10));
    const score = 10 + timeBonus; // Base 10 points + 0-10 bonus points
    
    // Award points
    this.state.addScore(playerId, score);
    
    // Set correct answer in state for display (but don't end round yet)
    this.state.correctAnswer = this.currentRoundAnswer;
    
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
    
    console.log(`All ${activePlayers.length} players have answered correctly`);
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
    
    console.log(`Round ${this.state.currentRound} completed in ${roundDuration}ms (${reason}, ${playerCount} players)`);
    
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
    
    // Reset game state for next game
    this.state.currentRound = 0;
    this.state.roundStartTime = 0;
    this.state.roundTimeRemaining = 0;
    this.state.roundEnded = false;
    this.state.correctAnswer = "";
    
    // Clear round guesses
    this.state.clearRoundGuesses();
    
    // Reset all player ready states and scores for next game
    for (const player of this.state.players.values()) {
      player.ready = false;
      player.score = 0;
    }
    
    // Reset used prompts for next game
    this.usedPrompts.clear();
    this.currentRoundAnswer = "";
    
    // Clear any timers
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = undefined;
    }
    
    // Update canStart status based on current players
    this.checkGameStart();
    
    console.log(`Game ended in room ${this.roomId}. Winner: ${winnerId}`);
    console.log('Game state reset for next game');
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
}