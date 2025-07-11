import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GameLobby } from "../../app/components/GameLobby";
import { GameState, PlayerData } from "@shared/index";

describe("GameLobby", () => {
  // Mock functions
  const mockOnPlayerReady = vi.fn();
  const mockOnStartGame = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper function to create a test game state
  const createGameState = (overrides: Partial<GameState> = {}): GameState => {
    const defaultPlayer: PlayerData = {
      id: "player1",
      name: "TestPlayer",
      score: 0,
      ready: false,
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
      gameStarted: false,
      gameEnded: false,
      gamePaused: false,
      canStart: true,
      currentRound: 0,
      hostId: "player1",
      winnerId: "",
      restartCountdown: 0,
      participatingPlayers: new Map<string, boolean>(),
      roundStartTime: 0,
      roundTimeRemaining: 0,
      roundEnded: false,
      correctAnswer: "",
      players: playersMap,
      currentPrompt: { id: "", text: "", category: "", difficulty: "easy", answer: "" },
      roundGuesses: new Map(),
      playerIncorrectGuesses: new Map(),
      chatMessages: new Map(),
      ...overrides
    };
  };

  describe("Player List Display", () => {
    it("displays single player correctly", () => {
      const gameState = createGameState();
      
      render(
        <GameLobby
          gameState={gameState}
          currentPlayerId="player1"
          onPlayerReady={mockOnPlayerReady}
          onStartGame={mockOnStartGame}
        />
      );

      expect(screen.getByText("Game Lobby")).toBeInTheDocument();
      expect(screen.getByText("Players: 1/8 • Ready: 0/1")).toBeInTheDocument();
      expect(screen.getByText("TestPlayer")).toBeInTheDocument();
      expect(screen.getByText("Host")).toBeInTheDocument();
      expect(screen.getByText("Score: 0")).toBeInTheDocument();
    });

    it("displays multiple players with correct sorting", () => {
      const gameState = createGameState();
      
      // Add second player (not host)
      const secondPlayer: PlayerData = {
        id: "player2",
        name: "SecondPlayer",
        score: 5,
        ready: true,
        isHost: false,
        joinedAt: Date.now() + 1000
      };
      gameState.players.set("player2", secondPlayer);

      render(
        <GameLobby
          gameState={gameState}
          currentPlayerId="player2"
          onPlayerReady={mockOnPlayerReady}
          onStartGame={mockOnStartGame}
        />
      );

      expect(screen.getByText("Players: 2/8 • Ready: 1/2")).toBeInTheDocument();
      
      // Check both players are displayed
      expect(screen.getByText("TestPlayer")).toBeInTheDocument();
      expect(screen.getByText("SecondPlayer")).toBeInTheDocument();
      
      // Check host badge only on first player
      expect(screen.getByText("Host")).toBeInTheDocument();
      
      // Check scores
      expect(screen.getByText("Score: 0")).toBeInTheDocument();
      expect(screen.getByText("Score: 5")).toBeInTheDocument();
    });

    it("shows correct ready status icons and text", () => {
      const gameState = createGameState();
      
      // Add ready and not ready players
      const readyPlayer: PlayerData = {
        id: "player2",
        name: "ReadyPlayer",
        score: 0,
        ready: true,
        isHost: false,
        joinedAt: Date.now() + 1000
      };
      gameState.players.set("player2", readyPlayer);

      render(
        <GameLobby
          gameState={gameState}
          currentPlayerId="player1"
          onPlayerReady={mockOnPlayerReady}
        />
      );

      // Check status text
      expect(screen.getByText("Not Ready")).toBeInTheDocument();
      expect(screen.getByText("Ready")).toBeInTheDocument();
      
      // Check icons are present (we use emojis ✅ and ⏳)
      expect(screen.getByText("⏳")).toBeInTheDocument();
      expect(screen.getByText("✅")).toBeInTheDocument();
    });

    it("handles empty players list gracefully", () => {
      const gameState = createGameState();
      gameState.players.clear();

      render(
        <GameLobby
          gameState={gameState}
          currentPlayerId="nonexistent"
          onPlayerReady={mockOnPlayerReady}
        />
      );

      expect(screen.getByText("Players: 0/8 • Ready: 0/0")).toBeInTheDocument();
      expect(screen.getByText("💡 Waiting for more players to join. Share the room link to invite friends!")).toBeInTheDocument();
    });
  });

  describe("Ready Toggle Functionality", () => {
    it("shows correct button text for not ready player", () => {
      const gameState = createGameState();
      
      render(
        <GameLobby
          gameState={gameState}
          currentPlayerId="player1"
          onPlayerReady={mockOnPlayerReady}
        />
      );

      const readyButton = screen.getByRole("button", { name: "Mark as Ready" });
      expect(readyButton).toBeInTheDocument();
      expect(readyButton).not.toBeDisabled();
    });

    it("shows correct button text for ready player", () => {
      const gameState = createGameState();
      gameState.players.get("player1")!.ready = true;
      
      render(
        <GameLobby
          gameState={gameState}
          currentPlayerId="player1"
          onPlayerReady={mockOnPlayerReady}
        />
      );

      const readyButton = screen.getByRole("button", { name: "Mark as Not Ready" });
      expect(readyButton).toBeInTheDocument();
      expect(readyButton).not.toBeDisabled();
    });

    it("calls onPlayerReady with correct value when clicked", async () => {
      const gameState = createGameState();
      
      render(
        <GameLobby
          gameState={gameState}
          currentPlayerId="player1"
          onPlayerReady={mockOnPlayerReady}
        />
      );

      const readyButton = screen.getByRole("button", { name: "Mark as Ready" });
      fireEvent.click(readyButton);

      expect(mockOnPlayerReady).toHaveBeenCalledWith(true);
    });

    it("shows loading state during ready toggle", async () => {
      const gameState = createGameState();
      
      // Make onPlayerReady return a pending promise
      let resolveReady: (value: unknown) => void;
      const readyPromise = new Promise((resolve) => {
        resolveReady = resolve;
      });
      mockOnPlayerReady.mockReturnValueOnce(readyPromise);
      
      render(
        <GameLobby
          gameState={gameState}
          currentPlayerId="player1"
          onPlayerReady={mockOnPlayerReady}
        />
      );

      const readyButton = screen.getByRole("button", { name: "Mark as Ready" });
      fireEvent.click(readyButton);

      // Should show loading state
      expect(screen.getByText("Updating...")).toBeInTheDocument();
      expect(readyButton).toBeDisabled();

      // Resolve the promise
      resolveReady!({});
      await waitFor(() => {
        expect(screen.getByText("Mark as Ready")).toBeInTheDocument();
      });
    });

    it("handles ready toggle errors gracefully", async () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      const gameState = createGameState();
      
      mockOnPlayerReady.mockRejectedValueOnce(new Error("Ready toggle failed"));
      
      render(
        <GameLobby
          gameState={gameState}
          currentPlayerId="player1"
          onPlayerReady={mockOnPlayerReady}
        />
      );

      const readyButton = screen.getByRole("button", { name: "Mark as Ready" });
      fireEvent.click(readyButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith("Failed to toggle ready state:", expect.any(Error));
      });

      // Should reset button state
      expect(screen.getByText("Mark as Ready")).toBeInTheDocument();
      expect(readyButton).not.toBeDisabled();

      consoleError.mockRestore();
    });
  });

  describe("Host Controls", () => {
    it("shows host controls only for host player", () => {
      const gameState = createGameState();
      
      render(
        <GameLobby
          gameState={gameState}
          currentPlayerId="player1"
          onPlayerReady={mockOnPlayerReady}
          onStartGame={mockOnStartGame}
        />
      );

      expect(screen.getByText("Host Controls")).toBeInTheDocument();
      expect(screen.getByText("Game Settings")).toBeInTheDocument();
      expect(screen.getByText("Target Score: 10 points")).toBeInTheDocument();
      expect(screen.getByText("Round Time: 30 seconds")).toBeInTheDocument();
      expect(screen.getByText("Max Players: 8")).toBeInTheDocument();
    });

    it("does not show host controls for non-host player", () => {
      const gameState = createGameState();
      
      // Add second player and make them current
      const secondPlayer: PlayerData = {
        id: "player2",
        name: "SecondPlayer",
        score: 0,
        ready: false,
        isHost: false,
        joinedAt: Date.now() + 1000
      };
      gameState.players.set("player2", secondPlayer);

      render(
        <GameLobby
          gameState={gameState}
          currentPlayerId="player2"
          onPlayerReady={mockOnPlayerReady}
          onStartGame={mockOnStartGame}
        />
      );

      expect(screen.queryByText("Host Controls")).not.toBeInTheDocument();
      expect(screen.queryByText("Game Settings")).not.toBeInTheDocument();
    });

    it("enables start game button when conditions are met", () => {
      const gameState = createGameState();
      gameState.canStart = true;
      
      // Add second ready player
      const secondPlayer: PlayerData = {
        id: "player2",
        name: "SecondPlayer",
        score: 0,
        ready: true,
        isHost: false,
        joinedAt: Date.now() + 1000
      };
      gameState.players.set("player2", secondPlayer);
      gameState.players.get("player1")!.ready = true;

      render(
        <GameLobby
          gameState={gameState}
          currentPlayerId="player1"
          onPlayerReady={mockOnPlayerReady}
          onStartGame={mockOnStartGame}
        />
      );

      const startButton = screen.getByRole("button", { name: "Start Game" });
      expect(startButton).not.toBeDisabled();
    });

    it("disables start game button when not enough ready players", () => {
      const gameState = createGameState();
      gameState.canStart = true;
      
      // Only one player, not ready
      render(
        <GameLobby
          gameState={gameState}
          currentPlayerId="player1"
          onPlayerReady={mockOnPlayerReady}
          onStartGame={mockOnStartGame}
        />
      );

      const startButton = screen.getByRole("button", { name: "Need 2 more ready players" });
      expect(startButton).toBeDisabled();
    });

    it("calls onStartGame when start button is clicked", () => {
      const gameState = createGameState();
      gameState.canStart = true;
      
      // Add second ready player
      const secondPlayer: PlayerData = {
        id: "player2",
        name: "SecondPlayer",
        score: 0,
        ready: true,
        isHost: false,
        joinedAt: Date.now() + 1000
      };
      gameState.players.set("player2", secondPlayer);
      gameState.players.get("player1")!.ready = true;

      render(
        <GameLobby
          gameState={gameState}
          currentPlayerId="player1"
          onPlayerReady={mockOnPlayerReady}
          onStartGame={mockOnStartGame}
        />
      );

      const startButton = screen.getByRole("button", { name: "Start Game" });
      fireEvent.click(startButton);

      expect(mockOnStartGame).toHaveBeenCalled();
    });

    it("does not call onStartGame when button is disabled", () => {
      const gameState = createGameState();
      gameState.canStart = false;

      render(
        <GameLobby
          gameState={gameState}
          currentPlayerId="player1"
          onPlayerReady={mockOnPlayerReady}
          onStartGame={mockOnStartGame}
        />
      );

      const startButton = screen.getByRole("button", { name: "Need 2 more ready players" });
      fireEvent.click(startButton);

      expect(mockOnStartGame).not.toHaveBeenCalled();
    });
  });

  describe("UI States and Messages", () => {
    it("shows help message when fewer than 2 players", () => {
      const gameState = createGameState();
      
      render(
        <GameLobby
          gameState={gameState}
          currentPlayerId="player1"
          onPlayerReady={mockOnPlayerReady}
        />
      );

      expect(screen.getByText("💡 Waiting for more players to join. Share the room link to invite friends!")).toBeInTheDocument();
    });

    it("does not show help message when 2 or more players", () => {
      const gameState = createGameState();
      
      // Add second player
      const secondPlayer: PlayerData = {
        id: "player2",
        name: "SecondPlayer",
        score: 0,
        ready: false,
        isHost: false,
        joinedAt: Date.now() + 1000
      };
      gameState.players.set("player2", secondPlayer);

      render(
        <GameLobby
          gameState={gameState}
          currentPlayerId="player1"
          onPlayerReady={mockOnPlayerReady}
        />
      );

      expect(screen.queryByText("💡 Waiting for more players to join. Share the room link to invite friends!")).not.toBeInTheDocument();
    });

    it("highlights current player's card", () => {
      const gameState = createGameState();
      
      render(
        <GameLobby
          gameState={gameState}
          currentPlayerId="player1"
          onPlayerReady={mockOnPlayerReady}
        />
      );

      // Find the player card container (the parent div with styling)
      const playerCard = screen.getByText("TestPlayer").closest(".bg-blue-50");
      expect(playerCard).toHaveClass("bg-blue-50", "border-blue-200");
    });
  });

  describe("Edge Cases", () => {
    it("handles missing current player gracefully", () => {
      const gameState = createGameState();
      
      render(
        <GameLobby
          gameState={gameState}
          currentPlayerId="nonexistent"
          onPlayerReady={mockOnPlayerReady}
        />
      );

      // Should still render without crashing
      expect(screen.getByText("Game Lobby")).toBeInTheDocument();
      
      // Ready button should still be enabled but clicking won't do anything
      // (the handleReadyToggle function handles missing currentPlayer)
      const readyButton = screen.getByRole("button", { name: "Mark as Ready" });
      expect(readyButton).not.toBeDisabled();
      
      // Clicking the button shouldn't call onPlayerReady
      fireEvent.click(readyButton);
      expect(mockOnPlayerReady).not.toHaveBeenCalled();
    });

    it("handles players with missing properties", () => {
      const gameState = createGameState();
      
      // Add player with minimal properties
      const incompletePlayer = {
        id: "incomplete",
        name: "IncompletePlayer",
        score: 0,
        ready: false,
        isHost: false,
        joinedAt: Date.now()
      } as PlayerData;
      gameState.players.set("incomplete", incompletePlayer);

      render(
        <GameLobby
          gameState={gameState}
          currentPlayerId="player1"
          onPlayerReady={mockOnPlayerReady}
        />
      );

      expect(screen.getByText("IncompletePlayer")).toBeInTheDocument();
      expect(screen.getByText("Players: 2/8 • Ready: 0/2")).toBeInTheDocument();
    });
  });
}); 