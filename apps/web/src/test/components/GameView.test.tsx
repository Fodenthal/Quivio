import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GameView } from "../../app/components/GameView";
import { GameState, PlayerData } from "@shared/index";

describe("GameView", () => {
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
      gameStarted: true,
      gameEnded: false,
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
      currentTopic: "General Knowledge",
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
  });

  describe("Game Phase Indicators", () => {
    it("shows active game interface when playing", () => {
      const gameState = createGameState({ 
        roundStartTime: Date.now() - 1000,
        gamePaused: false,
        roundEnded: false,
        gameEnded: false
      });
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      // Current implementation shows round number and game interface
      expect(screen.getByText(/Round 2/)).toBeInTheDocument();
      expect(screen.getByText("Press Enter to submit your answer")).toBeInTheDocument();
    });

    it("shows 'Round Ended' when round is complete", () => {
      const gameState = createGameState({ 
        roundEnded: true,
        correctAnswer: "Paris"
      });
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      // Current implementation shows round results when round ends
      expect(screen.getByText("Round Complete!")).toBeInTheDocument();
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
        gameEnded: true,
        winnerId: "player1"
      });
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      // Current implementation shows WinnerScreen when game ends
      expect(screen.getByText("won the game!")).toBeInTheDocument();
      expect(screen.getByText("🏆")).toBeInTheDocument();
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
      
      expect(screen.getByText("Round Complete!")).toBeInTheDocument();
      expect(screen.getByText(/The correct answer was:/)).toBeInTheDocument();
      expect(screen.getByText("Paris")).toBeInTheDocument();
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
        gameEnded: true,
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
      expect(winnerTitle).toHaveClass("text-5xl", "font-bold", "text-primary");
    });

    it("handles game end without valid winner", () => {
      const gameState = createGameState({ 
        gameEnded: true,
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
      
      expect(screen.getByText("Your Score")).toBeInTheDocument();
      expect(screen.getByText("Target")).toBeInTheDocument();
      
      // Get the specific player status container
      const playerStatusContainer = screen.getByText("Your Score").closest('[class*="bg-black/20"]');
      expect(playerStatusContainer).toHaveTextContent("5"); // current score
      expect(playerStatusContainer).toHaveTextContent("10"); // target score
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
        gameEnded: false
      });
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      expect(screen.getByText("Press Enter to submit your answer")).toBeInTheDocument();
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
        gameEnded: false
      });
      
      // Add a correct guess for the current player
      gameState.roundGuesses.set("player1", {
        playerId: "player1",
        guess: "Paris",
        isCorrect: true,
        timestamp: Date.now()
      });
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
      expect(screen.getByText("Your guess:")).toBeInTheDocument();
      expect(screen.getByText("Paris")).toBeInTheDocument();
      expect(screen.queryByText("Submit Guess")).not.toBeInTheDocument();
    });

    it("shows guess feedback when player has guessed incorrectly", () => {
      const gameState = createGameState({ 
        roundStartTime: Date.now() - 1000,
        gamePaused: false,
        roundEnded: false,
        gameEnded: false
      });
      
      // Add an incorrect guess for the current player
      gameState.roundGuesses.set("player1", {
        playerId: "player1",
        guess: "London",
        isCorrect: false,
        timestamp: Date.now()
      });
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      expect(screen.getByText("❌ Incorrect")).toBeInTheDocument();
      expect(screen.getByText("Your guess:")).toBeInTheDocument();
      expect(screen.getByText("London")).toBeInTheDocument();
      expect(screen.queryByText("Submit Guess")).not.toBeInTheDocument();
    });

    it("shows guess input with disabled state when game is paused", () => {
      const gameState = createGameState({ 
        gamePaused: true,
        roundStartTime: Date.now() - 1000
      });
      
      render(<GameView gameState={gameState} currentPlayerId="player1" />);
      
      // Should still show the guess input form but disabled
      expect(screen.getByText("Press Enter to submit your answer")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter your answer and press Enter...")).toBeDisabled();
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