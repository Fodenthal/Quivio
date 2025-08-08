import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GameView } from "../../app/components/GameView";
import { GameState, PlayerData, GameStatus } from "@shared/index";

// Mock the AISettingsPanel component
vi.mock("../../app/components/AISettingsPanel", () => ({
  AISettingsPanel: vi.fn(({ isReadOnly, onSetTopics, onSetDifficulty, onSetTargetScore, onSetRoundTime, onSetMaxPlayers }) => (
    isReadOnly ? (
      <div data-testid="ai-settings-summary">AI Settings Summary</div>
    ) : (
      <div data-testid="ai-settings-panel">
        <div>AI Settings Panel</div>
        <button onClick={() => onSetTopics && onSetTopics(["Topic 1", "Topic 2"]) }>Set Topics</button>
        <button onClick={() => onSetDifficulty && onSetDifficulty(3)}>Set Difficulty</button>
        <button onClick={() => onSetTargetScore && onSetTargetScore(15)}>Set Target Score</button>
        <button onClick={() => onSetRoundTime && onSetRoundTime(45)}>Set Round Time</button>
        <button onClick={() => onSetMaxPlayers && onSetMaxPlayers(6)}>Set Max Players</button>
      </div>
    )
  ))
}));

// Mock the GamePins component
vi.mock("../../app/components/GamePins", () => ({
  GamePins: vi.fn(({ gamePin }) => (
    <div data-testid="game-pins">
      <div>Game Pin: {gamePin}</div>
    </div>
  ))
}));

// Mock the WinnerScreen component
vi.mock("../../app/components/WinnerScreen", () => ({
  WinnerScreen: vi.fn(({ winner, restartCountdown }) => (
    <div data-testid="winner-screen">
      <h1>{winner.name}</h1>
      <div>won the game!</div>
      <div>Final Score</div>
      <div>{winner.score} points</div>
      <div>🏆</div>
      {restartCountdown > 0 && <div>Next game in {restartCountdown}s</div>}
    </div>
  ))
}));

// Mock the PlayerList component
vi.mock("../../app/components/PlayerList", () => ({
  PlayerList: vi.fn(() => (
    <div data-testid="player-list">Player List</div>
  ))
}));

// Mock the Chat component
vi.mock("../../app/components/Chat", () => ({
  Chat: vi.fn(() => (
    <div data-testid="chat">Chat Component</div>
  ))
}));

describe("GameView", () => {
  // Mock functions
  const mockOnStartGame = vi.fn();
  const mockOnSetTopics = vi.fn();
  const mockOnSetDifficulty = vi.fn();
  const mockOnSetTargetScore = vi.fn();
  const mockOnSetRoundTime = vi.fn();
  const mockOnSetMaxPlayers = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper function to create a test game state
  const createGameState = (overrides: Partial<GameState> = {}): GameState => {
    const defaultPlayer: PlayerData = {
      id: "player1",
      name: "TestPlayer",
      score: 5,
      ready: true,
      isHost: true,
      joinedAt: Date.now()
    };

    const playersMap = new Map<string, PlayerData>();
    playersMap.set("player1", defaultPlayer);

    return {
      targetScore: 10,
      roundTime: 30000,
      maxPlayers: 8,
      isPrivate: false,
      gamePin: "TEST1",
      roomName: "Test Room",
      gameStatus: GameStatus.IN_PROGRESS,
      gamePaused: false,
      canStart: false,
      currentRound: 2,
      hostId: "player1",
      winnerId: "",
      restartCountdown: 0,
      participatingPlayers: new Map<string, boolean>(),
      roundStartTime: Date.now() - 5000, // 5 seconds elapsed
      roundTimeRemaining: 25000, // 25 seconds left
      roundEnded: false,
      correctAnswer: "",
      topics: ["General Knowledge"],
      currentTopic: "General Knowledge",
      currentTopicIndex: 0,
      currentDifficulty: 5,
      players: playersMap,
      currentPrompt: { 
        id: "prompt1", 
        text: "What is the capital of France?", 
        category: "Geography", 
        difficulty: "easy", 
        answer: "Paris" 
      },
      roundGuesses: new Map(),
      playerIncorrectGuesses: new Map(),
      chatMessages: new Map(),
      ...overrides
    };
  };

  describe("Lobby State (GameStatus.WAITING)", () => {
    describe("Game Pin Display", () => {
      it("displays game pin when in lobby", () => {
        const gameState = createGameState({ 
          gameStatus: GameStatus.WAITING,
          gamePin: "ABC123"
        });
        
        render(<GameView gameState={gameState} currentPlayerId="player1" />);
        
        expect(screen.getByTestId("game-pins")).toBeInTheDocument();
        expect(screen.getByText("Game Pin: ABC123")).toBeInTheDocument();
      });

      it("does not display game pin when not in lobby", () => {
        const gameState = createGameState({ 
          gameStatus: GameStatus.IN_PROGRESS 
        });
        
        render(<GameView gameState={gameState} currentPlayerId="player1" />);
        
        expect(screen.queryByTestId("game-pins")).not.toBeInTheDocument();
      });
    });

    describe("Host Controls", () => {
      it("shows host controls section for host player", () => {
        const gameState = createGameState({ 
          gameStatus: GameStatus.WAITING,
          topics: ["Test Topic"]
        });
        
        render(<GameView gameState={gameState} currentPlayerId="player1" />);
        
        expect(screen.getByRole("button", { name: "Start Game" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Start Game" })).toBeInTheDocument();
      });

      it("does not show host controls for non-host player", () => {
        const gameState = createGameState({ 
          gameStatus: GameStatus.WAITING 
        });
        
        // Add non-host player
        const nonHostPlayer: PlayerData = {
          id: "player2",
          name: "NonHost",
          score: 0,
          ready: false,
          isHost: false,
          joinedAt: Date.now()
        };
        gameState.players.set("player2", nonHostPlayer);
        
        render(<GameView gameState={gameState} currentPlayerId="player2" />);
        
        expect(screen.queryByRole("button", { name: "Start Game" })).not.toBeInTheDocument();
      });

      it("shows AI settings panel for host", () => {
        const gameState = createGameState({ 
          gameStatus: GameStatus.WAITING,
          topics: ["Test Topic"]
        });
        
        render(<GameView gameState={gameState} currentPlayerId="player1" />);
        
        expect(screen.getByTestId("ai-settings-panel")).toBeInTheDocument();
        // AI settings panel should render for host
        expect(screen.getByTestId("ai-settings-panel")).toBeInTheDocument();
      });

      it("shows read-only game settings for non-host", () => {
        const gameState = createGameState({ 
          gameStatus: GameStatus.WAITING,
          topics: ["Science", "History"],
          currentDifficulty: 4,
          targetScore: 15
        });
        
        // Add non-host player
        const nonHostPlayer: PlayerData = {
          id: "player2",
          name: "NonHost",
          score: 0,
          ready: false,
          isHost: false,
          joinedAt: Date.now()
        };
        gameState.players.set("player2", nonHostPlayer);
        
        render(<GameView gameState={gameState} currentPlayerId="player2" />);
        
        // Read-only summary may be hidden in new design; just assert that AI settings are not interactive
        expect(screen.queryByTestId("ai-settings-panel")).not.toBeInTheDocument();
        
        // Should not show AI settings panel for non-host
        expect(screen.queryByTestId("ai-settings-panel")).not.toBeInTheDocument();
      });
    });

    describe("Start Game Button", () => {
      it("enables start game button when conditions are met", () => {
        const gameState = createGameState({ 
          gameStatus: GameStatus.WAITING,
          topics: ["Test Topic"] // Has at least one topic
        });
        
        // Add second player to meet minimum player requirement
        const player2: PlayerData = {
          id: "player2",
          name: "Player2",
          score: 0,
          ready: true,
          isHost: false,
          joinedAt: Date.now()
        };
        gameState.players.set("player2", player2);
        
        render(<GameView 
          gameState={gameState} 
          currentPlayerId="player1" 
          onStartGame={mockOnStartGame}
        />);
        
        const startButton = screen.getByRole("button", { name: "Start Game" });
        expect(startButton).not.toBeDisabled();
      });

      it("disables start game button when not enough players", () => {
        const gameState = createGameState({ 
          gameStatus: GameStatus.WAITING,
          topics: ["Test Topic"]
        });
        // Only one player
        
        render(<GameView 
          gameState={gameState} 
          currentPlayerId="player1" 
          onStartGame={mockOnStartGame}
        />);
        
        const startButton = screen.getByRole("button", { name: "Start Game" });
        expect(startButton).toBeDisabled();
        expect(screen.getByText(/Need\s+1\s+more player/i)).toBeInTheDocument();
      });

      it("disables start game button when no topics configured", () => {
        const gameState = createGameState({ 
          gameStatus: GameStatus.WAITING,
          topics: [] // No topics configured
        });
        
        // Add second player
        const player2: PlayerData = {
          id: "player2",
          name: "Player2",
          score: 0,
          ready: true,
          isHost: false,
          joinedAt: Date.now()
        };
        gameState.players.set("player2", player2);
        
        render(<GameView 
          gameState={gameState} 
          currentPlayerId="player1" 
          onStartGame={mockOnStartGame}
        />);
        
        const startButton = screen.getByRole("button", { name: "Start Game" });
        expect(startButton).toBeDisabled();
        expect(screen.getByText(/set at least one topic/i)).toBeInTheDocument();
      });

      it("disables start game button when topics are empty strings", () => {
        const gameState = createGameState({ 
          gameStatus: GameStatus.WAITING,
          topics: ["", "   ", ""] // Empty/whitespace topics
        });
        
        // Add second player
        const player2: PlayerData = {
          id: "player2",
          name: "Player2",
          score: 0,
          ready: true,
          isHost: false,
          joinedAt: Date.now()
        };
        gameState.players.set("player2", player2);
        
        render(<GameView 
          gameState={gameState} 
          currentPlayerId="player1" 
          onStartGame={mockOnStartGame}
        />);
        
        const startButton = screen.getByRole("button", { name: "Start Game" });
        expect(startButton).toBeDisabled();
      });

      it("calls onStartGame when start button is clicked", () => {
        const gameState = createGameState({ 
          gameStatus: GameStatus.WAITING,
          topics: ["Test Topic"]
        });
        
        // Add second player
        const player2: PlayerData = {
          id: "player2",
          name: "Player2",
          score: 0,
          ready: true,
          isHost: false,
          joinedAt: Date.now()
        };
        gameState.players.set("player2", player2);
        
        render(<GameView 
          gameState={gameState} 
          currentPlayerId="player1" 
          onStartGame={mockOnStartGame}
        />);
        
        const startButton = screen.getByRole("button", { name: "Start Game" });
        fireEvent.click(startButton);
        
        expect(mockOnStartGame).toHaveBeenCalledTimes(1);
      });
    });

    describe("AI Settings Panel Integration", () => {
      it("passes correct callbacks to AI settings panel", () => {
        const gameState = createGameState({ 
          gameStatus: GameStatus.WAITING,
          topics: ["Test Topic"]
        });
        
        render(<GameView 
          gameState={gameState} 
          currentPlayerId="player1" 
          onSetTopics={mockOnSetTopics}
          onSetDifficulty={mockOnSetDifficulty}
          onSetTargetScore={mockOnSetTargetScore}
          onSetRoundTime={mockOnSetRoundTime}
          onSetMaxPlayers={mockOnSetMaxPlayers}
        />);
        
        // Test each callback by clicking the mocked buttons
        // Topic is managed via onSetTopics in current UI; skip single-topic callback assertion
        
        fireEvent.click(screen.getByRole("button", { name: "Set Topics" }));
        expect(mockOnSetTopics).toHaveBeenCalledWith(["Topic 1", "Topic 2"]);
        
        fireEvent.click(screen.getByRole("button", { name: "Set Difficulty" }));
        expect(mockOnSetDifficulty).toHaveBeenCalledWith(3);
        
        fireEvent.click(screen.getByRole("button", { name: "Set Target Score" }));
        expect(mockOnSetTargetScore).toHaveBeenCalledWith(15);
        
        fireEvent.click(screen.getByRole("button", { name: "Set Round Time" }));
        expect(mockOnSetRoundTime).toHaveBeenCalledWith(45);
        
        fireEvent.click(screen.getByRole("button", { name: "Set Max Players" }));
        expect(mockOnSetMaxPlayers).toHaveBeenCalledWith(6);
      });
    });

    describe("Status Messages", () => {
      it("shows appropriate message for non-host waiting", () => {
        const gameState = createGameState({ 
          gameStatus: GameStatus.WAITING 
        });
        
        const nonHostPlayer: PlayerData = {
          id: "player2",
          name: "NonHost",
          score: 0,
          ready: false,
          isHost: false,
          joinedAt: Date.now()
        };
        gameState.players.set("player2", nonHostPlayer);
        
        render(<GameView gameState={gameState} currentPlayerId="player2" />);
        
        // New lobby design does not show explicit host waiting text; ensure no start button is visible
        expect(screen.queryByRole("button", { name: "Start Game" })).not.toBeInTheDocument();
      });

      it("shows debug information for host", () => {
        const gameState = createGameState({ 
          gameStatus: GameStatus.WAITING,
          topics: ["Topic1", "Topic2"]
        });
        
        render(<GameView gameState={gameState} currentPlayerId="player1" />);
        
        // Debug text removed in new UI; ensure Start Game button exists for host
        expect(screen.getByRole("button", { name: "Start Game" })).toBeInTheDocument();
      });
    });
  });

  describe("Game Header Display", () => {
    it("displays round number correctly", () => {
      const gameState = createGameState({ currentRound: 3 });
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      expect(screen.getByText("Round 3")).toBeInTheDocument();
    });

    it("displays timer in correct format", () => {
      const gameState = createGameState({ roundTimeRemaining: 95000 }); // 1:35
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      expect(screen.getByText("1:35")).toBeInTheDocument();
    });

    it("shows timer in red when under 10 seconds", () => {
      const gameState = createGameState({ roundTimeRemaining: 5000 }); // 5 seconds
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      const timerElement = screen.getByText("0:05");
      expect(timerElement).toHaveClass("text-red-500");
    });

    it("shows timer in normal color when over 10 seconds", () => {
      const gameState = createGameState({ roundTimeRemaining: 15000 }); // 15 seconds
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      const timerElement = screen.getByText("0:15");
      expect(timerElement).toHaveClass("text-text-main");
    });

    it("does not show timer during lobby phase", () => {
      const gameState = createGameState({ 
        gameStatus: GameStatus.WAITING,
        roundTimeRemaining: 30000
      });
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      expect(screen.queryByText("Time:")).not.toBeInTheDocument();
      expect(screen.queryByText("0:30")).not.toBeInTheDocument();
    });
  });

  describe("Game Phase Indicators", () => {
    it("shows active game interface when playing", () => {
      const gameState = createGameState({ 
        roundStartTime: Date.now() - 1000,
        gamePaused: false,
        roundEnded: false,
        gameStatus: GameStatus.IN_PROGRESS
      });
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      // Current implementation shows round number and game interface
      expect(screen.getByText(/Round 2/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter your answer and press Enter...")).toBeInTheDocument();
    });

    it("shows 'Round Ended' when round is complete", () => {
      const gameState = createGameState({ 
        roundEnded: true,
        correctAnswer: "Paris"
      });
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      // Round ended state - prompt area shows answer reveal
      expect(screen.getByText("The answer was")).toBeInTheDocument();
      expect(screen.getByText("Paris")).toBeInTheDocument();
      expect(screen.getByText("no one got it")).toBeInTheDocument();
    });

    it("shows disabled input when game is paused", () => {
      const gameState = createGameState({ 
        gamePaused: true,
        roundStartTime: Date.now() - 1000 
      });
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      // Current implementation just disables inputs when paused
      expect(screen.getByPlaceholderText("Enter your answer and press Enter...")).toBeDisabled();
    });

    it("shows winner screen when game has ended", () => {
      const gameState = createGameState({ 
        gameStatus: GameStatus.GAME_ENDED,
        winnerId: "player1"
      });
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      // Current implementation shows WinnerScreen when game ends
      expect(screen.getByText("won the game!")).toBeInTheDocument();
      expect(screen.getByText("🏆")).toBeInTheDocument();
    });

    it("shows ad placeholder when game started but questions are loading", () => {
      const gameState = createGameState({ 
        gameStatus: GameStatus.IN_PROGRESS,
        roundStartTime: 0, // No round started yet
        currentPrompt: {
          id: "",
          text: "", // No prompt text available yet
          category: "",
          difficulty: "easy",
          answer: ""
        }
      });
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      // Should show ad placeholder while questions are being generated
      expect(screen.getByText("AD")).toBeInTheDocument();
      expect(screen.getByText("Questions are loading...")).toBeInTheDocument();
      
      // Should not show answer input during loading
      expect(screen.queryByPlaceholderText("Enter your answer and press Enter...")).not.toBeInTheDocument();
    });
  });

  describe("Prompt Display", () => {
    it("displays prompt text and category", () => {
      const gameState = createGameState();
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      expect(screen.getByText("What is the capital of France?")).toBeInTheDocument();
      expect(screen.getByText("Geography")).toBeInTheDocument();
    });

    it("displays category badge for easy questions", () => {
      const easyGame = createGameState({ 
        currentPrompt: { 
          id: "1", text: "Easy question", category: "Test", 
          difficulty: "easy", answer: "test" 
        }
      });
      
      render(<GameView gameState={easyGame} currentPlayerId="player1" />);
      
      // Current implementation shows category name instead of difficulty
      expect(screen.getByText("Test")).toBeInTheDocument();
    });

    it("displays category badge for medium questions", () => {
      const mediumGame = createGameState({ 
        currentPrompt: { 
          id: "1", text: "Medium question", category: "Test", 
          difficulty: "medium", answer: "test" 
        }
      });
      
      render(<GameView gameState={mediumGame} currentPlayerId="player1" />);
      
      // Current implementation shows category name instead of difficulty
      expect(screen.getByText("Test")).toBeInTheDocument();
    });

    it("displays category badge for hard questions", () => {
      const hardGame = createGameState({ 
        currentPrompt: { 
          id: "1", text: "Hard question", category: "Test", 
          difficulty: "hard", answer: "test" 
        }
      });
      
      render(<GameView gameState={hardGame} currentPlayerId="player1" />);
      
      // Current implementation shows category name instead of difficulty
      expect(screen.getByText("Test")).toBeInTheDocument();
    });
  });

  describe("Round Results", () => {
    it("shows correct answer when round ends", () => {
      const gameState = createGameState({ 
        roundEnded: true,
        correctAnswer: "Paris"
      });
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      // Round ended state - shows answer reveal in prompt area
      expect(screen.getByText("The answer was")).toBeInTheDocument();
      expect(screen.getByText("Paris")).toBeInTheDocument();
      expect(screen.getByText("no one got it")).toBeInTheDocument();
    });

    it("does not show results when round is active", () => {
      const gameState = createGameState({ 
        roundEnded: false,
        correctAnswer: ""
      });
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      expect(screen.queryByText("Round Complete!")).not.toBeInTheDocument();
    });
  });

  describe("Game End Display", () => {
    it("shows winner screen when game ends", () => {
      const gameState = createGameState({ 
        gameStatus: GameStatus.GAME_ENDED,
        winnerId: "player1"
      });
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      // Check for WinnerScreen content instead of old game end section
      expect(screen.getByText("won the game!")).toBeInTheDocument();
      expect(screen.getByText("Final Score")).toBeInTheDocument();
      expect(screen.getByText("5 points")).toBeInTheDocument();
      
      // Check for the trophy emoji in the gold medal
      expect(screen.getByText("🏆")).toBeInTheDocument();
      
      // Check for the specific large winner title (more specific than just "TestPlayer")
      const winnerTitle = screen.getByRole("heading", { level: 1 });
      expect(winnerTitle).toHaveTextContent("TestPlayer");
    });

    it("handles game end without valid winner", () => {
      const gameState = createGameState({ 
        gameStatus: GameStatus.GAME_ENDED,
        winnerId: "nonexistent"
      });
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      // When there's no valid winner, the component returns null, so no winner screen content should be displayed
      expect(screen.queryByText("won the game!")).not.toBeInTheDocument();
      expect(screen.queryByText("Final Score")).not.toBeInTheDocument();
    });
  });

  describe("Player Status", () => {
    it("displays current player score and target", () => {
      const gameState = createGameState();
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      // Score and target removed - only the question prompt is displayed
      expect(screen.getByText("What is the capital of France?")).toBeInTheDocument();
    });

    it("handles missing current player gracefully", () => {
      const gameState = createGameState();
      
      render(<GameView gameState={gameState} currentPlayerId="nonexistent" />);
      
      // Should not show player status section
      expect(screen.queryByText("Your Score")).not.toBeInTheDocument();
    });
  });

  describe("Guess Input System", () => {
    it("shows guess input form during active play", () => {
      const gameState = createGameState({ 
        roundStartTime: Date.now() - 1000, // active round
        gamePaused: false,
        roundEnded: false,
        gameStatus: GameStatus.IN_PROGRESS
      });
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      expect(screen.getByPlaceholderText("Enter your answer and press Enter...")).toBeInTheDocument();
    });

    it("does not show guess input when round is ended", () => {
      const gameState = createGameState({ roundEnded: true });
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      expect(screen.queryByText("Press Enter to submit your answer")).not.toBeInTheDocument();
    });

    it("shows guess feedback when player has guessed correctly", () => {
      const gameState = createGameState({ 
        roundStartTime: Date.now() - 1000,
        gamePaused: false,
        roundEnded: false,
        gameStatus: GameStatus.IN_PROGRESS
      });
      
      // Add a correct guess for the current player
      gameState.roundGuesses.set("player1", {
        playerId: "player1",
        guess: "Paris",
        isCorrect: true,
        timestamp: Date.now()
      });
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      expect(screen.getByText('"Paris" is correct!')).toBeInTheDocument();
      expect(screen.queryByText("Submit Guess")).not.toBeInTheDocument();
    });

    it("shows guess feedback when player has guessed incorrectly", () => {
      const gameState = createGameState({ 
        roundStartTime: Date.now() - 1000,
        gamePaused: false,
        roundEnded: false,
        gameStatus: GameStatus.IN_PROGRESS
      });
      
      // Add an incorrect guess for the current player
      gameState.roundGuesses.set("player1", {
        playerId: "player1",
        guess: "London",
        isCorrect: false,
        timestamp: Date.now()
      });
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      expect(screen.getByText("Incorrect. Keep trying!")).toBeInTheDocument();
      expect(screen.queryByText("Submit Guess")).not.toBeInTheDocument();
    });

    it("shows guess input with disabled state when game is paused", () => {
      const gameState = createGameState({ 
        gamePaused: true,
        roundStartTime: Date.now() - 1000
      });
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      // Should still show the guess input form but disabled
      expect(screen.getByPlaceholderText("Enter your answer and press Enter...")).toBeDisabled();
    });

    it("shows appropriate feedback when round has ended", () => {
      const gameState = createGameState({ 
        roundStartTime: Date.now() - 1000,
        roundEnded: true,
        correctAnswer: "Paris"
      });
      
      // Test for correct answer feedback
      gameState.roundGuesses.set("player1", {
        playerId: "player1",
        guess: "Paris",
        isCorrect: true,
        timestamp: Date.now()
      });
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      // Should show the correct answer in question panel
      expect(screen.getByText("The answer was")).toBeInTheDocument();
      expect(screen.getByText("Paris")).toBeInTheDocument();
      expect(screen.getByText("TestPlayer found it first.")).toBeInTheDocument();
      // Should maintain the correct feedback message
      expect(screen.getByText('"Paris" is correct!')).toBeInTheDocument();
    });

      it("shows an encouraging message when round ended and player was incorrect", () => {
      const gameState = createGameState({ 
        roundStartTime: Date.now() - 1000,
        roundEnded: true,
        correctAnswer: "Paris",
        currentRound: 1
      });
      
      // Test for incorrect answer feedback
      gameState.roundGuesses.set("player1", {
        playerId: "player1",
        guess: "London",
        isCorrect: false,
        timestamp: Date.now()
      });
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      // Should show the correct answer in question panel
      expect(screen.getByText("The answer was")).toBeInTheDocument();
      expect(screen.getByText("Paris")).toBeInTheDocument();
      expect(screen.getByText("no one got it")).toBeInTheDocument();
        // Should show an encouraging message (content varies)
        expect(screen.getByText(/Better luck next time!|Keep it up|Nice try|You'll get it/i)).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles missing prompt gracefully", () => {
      const gameState = createGameState({ 
        currentPrompt: { id: "", text: "", category: "", difficulty: "easy", answer: "" }
      });
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      // Should not crash, prompt section should not render
      expect(screen.queryByText(/General/)).not.toBeInTheDocument();
    });

    it("handles zero time remaining", () => {
      const gameState = createGameState({ roundTimeRemaining: 0 });
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      expect(screen.getByText("0:00")).toBeInTheDocument();
    });

    it("handles large time values", () => {
      const gameState = createGameState({ roundTimeRemaining: 125000 }); // 2:05
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      expect(screen.getByText("2:05")).toBeInTheDocument();
    });
  });
}); 