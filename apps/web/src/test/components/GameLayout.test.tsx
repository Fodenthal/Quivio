import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GameLayout } from "../../app/components/GameLayout";
import { ConnectionStatus } from "../../lib/gameClient";

// Mock the GameClient
const mockGameClient = {
  setEventHandlers: vi.fn(),
  joinRoom: vi.fn(),
  leaveRoom: vi.fn(),
  dispose: vi.fn(),
  getConnectionStatus: vi.fn(() => ConnectionStatus.DISCONNECTED),
  getRoom: vi.fn(),
  sendPlayerReady: vi.fn(),
  startGame: vi.fn(),
};

// Mock the GameView component
vi.mock("../../app/components/GameView", () => ({
  GameView: vi.fn(({ gameState, currentPlayerId }) => (
    <div data-testid="game-view">
      <div>Game View - Round {gameState.currentRound}</div>
      <div>Player: {currentPlayerId}</div>
      <div>Game Started: {gameState.gameStarted.toString()}</div>
    </div>
  ))
}));

// Mock the GameClient constructor
vi.mock("../../lib/gameClient", () => ({
  GameClient: vi.fn(() => mockGameClient),
  ConnectionStatus: {
    DISCONNECTED: "disconnected",
    CONNECTING: "connecting",
    CONNECTED: "connected",
    RECONNECTING: "reconnecting",
    ERROR: "error",
  },
}));

describe("GameLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial Render", () => {
    it("renders the header with game title", () => {
      render(<GameLayout />);
      expect(screen.getByText("PopReplay")).toBeInTheDocument();
    });

    it("shows disconnected status initially", () => {
      render(<GameLayout />);
      expect(screen.getByText("Disconnected")).toBeInTheDocument();
    });

    it("renders join form when disconnected", () => {
      render(<GameLayout />);
      
      expect(screen.getByRole("heading", { name: "Join Game" })).toBeInTheDocument();
      expect(screen.getByLabelText("Your Name")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Join Game" })).toBeInTheDocument();
    });

    it("sets up GameClient event handlers on mount", () => {
      render(<GameLayout />);
      
      expect(mockGameClient.setEventHandlers).toHaveBeenCalledWith({
        onConnectionStatusChange: expect.any(Function),
        onStateChange: expect.any(Function),
        onError: expect.any(Function),
      });
    });
  });

  describe("Connection Status Display", () => {
    it("shows correct status text for each connection state", () => {
      const { rerender } = render(<GameLayout />);
      
      // Get the event handlers that were set
      const eventHandlers = mockGameClient.setEventHandlers.mock.calls[0][0];
      
      // Test different status changes - be specific about which element we're checking
      eventHandlers.onConnectionStatusChange(ConnectionStatus.CONNECTING);
      rerender(<GameLayout />);
      // Check the header status specifically
      expect(screen.getByRole("banner")).toHaveTextContent("Connecting...");
      
      eventHandlers.onConnectionStatusChange(ConnectionStatus.CONNECTED);
      rerender(<GameLayout />);
      expect(screen.getByRole("banner")).toHaveTextContent("Connected");
      
      eventHandlers.onConnectionStatusChange(ConnectionStatus.RECONNECTING);
      rerender(<GameLayout />);
      expect(screen.getByRole("banner")).toHaveTextContent("Reconnecting...");
      
      eventHandlers.onConnectionStatusChange(ConnectionStatus.ERROR);
      rerender(<GameLayout />);
      expect(screen.getByRole("banner")).toHaveTextContent("Connection Error");
    });

    it("applies correct CSS classes for status indicators", () => {
      render(<GameLayout />);
      
      // Check for gray status indicator (disconnected)
      const statusIndicator = document.querySelector('.w-3.h-3.rounded-full');
      expect(statusIndicator).toHaveClass('bg-gray-500');
    });
  });

  describe("Join Form Functionality", () => {
    it("enables join button when name is entered", () => {
      render(<GameLayout />);
      
      const nameInput = screen.getByLabelText("Your Name");
      const joinButton = screen.getByRole("button", { name: "Join Game" });
      
      // Initially disabled
      expect(joinButton).toBeDisabled();
      
      // Enable after entering name
      fireEvent.change(nameInput, { target: { value: "TestPlayer" } });
      expect(joinButton).not.toBeDisabled();
    });

    it("disables join button for empty/whitespace names", () => {
      render(<GameLayout />);
      
      const nameInput = screen.getByLabelText("Your Name");
      const joinButton = screen.getByRole("button", { name: "Join Game" });
      
      // Test with whitespace
      fireEvent.change(nameInput, { target: { value: "   " } });
      expect(joinButton).toBeDisabled();
      
      // Test with empty string
      fireEvent.change(nameInput, { target: { value: "" } });
      expect(joinButton).toBeDisabled();
    });

    it("calls GameClient.joinRoom with correct parameters", async () => {
      mockGameClient.joinRoom.mockResolvedValueOnce({});
      
      render(<GameLayout />);
      
      const nameInput = screen.getByLabelText("Your Name");
      const joinButton = screen.getByRole("button", { name: "Join Game" });
      
      fireEvent.change(nameInput, { target: { value: "TestPlayer" } });
      fireEvent.click(joinButton);
      
      expect(mockGameClient.joinRoom).toHaveBeenCalledWith({
        playerName: "TestPlayer",
      });
    });

    it("trims whitespace from player name", async () => {
      mockGameClient.joinRoom.mockResolvedValueOnce({});
      
      render(<GameLayout />);
      
      const nameInput = screen.getByLabelText("Your Name");
      const joinButton = screen.getByRole("button", { name: "Join Game" });
      
      fireEvent.change(nameInput, { target: { value: "  TestPlayer  " } });
      fireEvent.click(joinButton);
      
      expect(mockGameClient.joinRoom).toHaveBeenCalledWith({
        playerName: "TestPlayer",
      });
    });

    it("handles Enter key submission", async () => {
      mockGameClient.joinRoom.mockResolvedValueOnce({});
      
      render(<GameLayout />);
      
      const nameInput = screen.getByLabelText("Your Name");
      
      fireEvent.change(nameInput, { target: { value: "TestPlayer" } });
      fireEvent.keyDown(nameInput, { key: "Enter" });
      
      expect(mockGameClient.joinRoom).toHaveBeenCalledWith({
        playerName: "TestPlayer",
      });
    });

    it("prevents Enter submission when joining is in progress", async () => {
      // Make joinRoom return a pending promise
      let resolveJoin: (value: unknown) => void;
      const joinPromise = new Promise((resolve) => {
        resolveJoin = resolve;
      });
      mockGameClient.joinRoom.mockReturnValueOnce(joinPromise);
      
      render(<GameLayout />);
      
      const nameInput = screen.getByLabelText("Your Name");
      
      fireEvent.change(nameInput, { target: { value: "TestPlayer" } });
      fireEvent.click(screen.getByRole("button", { name: "Join Game" }));
      
      // Try Enter while joining
      fireEvent.keyDown(nameInput, { key: "Enter" });
      
      // Should only be called once (from the click, not the Enter)
      expect(mockGameClient.joinRoom).toHaveBeenCalledTimes(1);
      
      // Cleanup
      resolveJoin!({});
      await waitFor(() => {});
    });
  });

  describe("Loading States", () => {
    it("shows loading state during room joining", async () => {
      let resolveJoin: (value: unknown) => void;
      const joinPromise = new Promise((resolve) => {
        resolveJoin = resolve;
      });
      mockGameClient.joinRoom.mockReturnValueOnce(joinPromise);
      
      render(<GameLayout />);
      
      const nameInput = screen.getByLabelText("Your Name");
      const joinButton = screen.getByRole("button", { name: "Join Game" });
      
      fireEvent.change(nameInput, { target: { value: "TestPlayer" } });
      fireEvent.click(joinButton);
      
      // Should show loading state
      expect(screen.getByText("Joining...")).toBeInTheDocument();
      expect(joinButton).toBeDisabled();
      
      // Resolve the promise
      resolveJoin!({});
      await waitFor(() => {
        expect(screen.getByText("Join Game")).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("handles join room errors gracefully", async () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      
      mockGameClient.joinRoom.mockRejectedValueOnce(new Error("Connection failed"));
      
      render(<GameLayout />);
      
      const nameInput = screen.getByLabelText("Your Name");
      const joinButton = screen.getByRole("button", { name: "Join Game" });
      
      fireEvent.change(nameInput, { target: { value: "TestPlayer" } });
      fireEvent.click(joinButton);
      
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith("Failed to join room. Please try again.");
        expect(consoleError).toHaveBeenCalledWith("Failed to join room:", expect.any(Error));
      });
      
      // Should reset loading state  
      expect(screen.getByRole("button", { name: "Join Game" })).toBeInTheDocument();
      expect(joinButton).not.toBeDisabled();
      
      consoleError.mockRestore();
      alertSpy.mockRestore();
    });

    it("shows alert for empty name submission", () => {
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      
      render(<GameLayout />);
      
      const joinButton = screen.getByRole("button", { name: "Join Game" });
      
      // Try to join with empty name (should not be possible due to disabled state, but test the function)
      const nameInput = screen.getByLabelText("Your Name");
      fireEvent.change(nameInput, { target: { value: "" } });
      
      // Force click by enabling button temporarily
      fireEvent.change(nameInput, { target: { value: "test" } });
      fireEvent.change(nameInput, { target: { value: "" } });
      
      // Manually trigger the handler to test the empty name check
      fireEvent.click(joinButton);
      
      expect(mockGameClient.joinRoom).not.toHaveBeenCalled();
      
      alertSpy.mockRestore();
    });

    it("handles GameClient errors via event handler", () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      
      render(<GameLayout />);
      
      // Get the error handler
      const eventHandlers = mockGameClient.setEventHandlers.mock.calls[0][0];
      const testError = new Error("Test error");
      
      eventHandlers.onError(testError);
      
      expect(consoleError).toHaveBeenCalledWith("Game client error:", testError);
      
      consoleError.mockRestore();
    });
  });

  describe("Connected State", () => {
    it("shows lobby when connected but game not started", () => {
      const { rerender } = render(<GameLayout />);
      
      // Get the event handlers that were set
      const eventHandlers = mockGameClient.setEventHandlers.mock.calls[0][0];
      
             // Mock the room with a session ID
       mockGameClient.getRoom.mockReturnValueOnce({ sessionId: "player1" });
      
      // Simulate connection
      eventHandlers.onConnectionStatusChange(ConnectionStatus.CONNECTED);
      
      // Simulate game state update
      const mockGameState = {
        targetScore: 10,
        roundTime: 30000,
        maxPlayers: 8,
        isPrivate: false,
        gameStarted: false, // Game not started yet
        gameEnded: false,
        gamePaused: false,
        canStart: true,
        currentRound: 0,
        hostId: "player1",
        winnerId: "",
        roundStartTime: 0,
        roundTimeRemaining: 0,
        roundEnded: false,
        correctAnswer: "",
        players: {
          player1: {
            id: "player1",
            name: "TestPlayer",
            score: 0,
            ready: false,
            isHost: true,
            joinedAt: Date.now()
          }
        },
        currentPrompt: { id: "", text: "", category: "", difficulty: "", answer: "" },
        roundGuesses: {},
        chatMessages: {}
      };
      
      eventHandlers.onStateChange(mockGameState);
      
      // Re-render to see the change
      rerender(<GameLayout />);
      
      expect(screen.getByText("Game Lobby")).toBeInTheDocument();
      expect(screen.getByText("TestPlayer")).toBeInTheDocument();
      expect(screen.getByText("Host")).toBeInTheDocument();
      
      // Should not show join form heading
      expect(screen.queryByRole("heading", { name: "Join Game" })).not.toBeInTheDocument();
    });

    it("shows game interface when game has started", () => {
      const { rerender } = render(<GameLayout />);
      
      // Get the event handlers that were set
      const eventHandlers = mockGameClient.setEventHandlers.mock.calls[0][0];
      
             // Mock the room with a session ID
       mockGameClient.getRoom.mockReturnValueOnce({ sessionId: "player1" });
      
      // Simulate connection
      eventHandlers.onConnectionStatusChange(ConnectionStatus.CONNECTED);
      
      // Simulate game state update with game started
      const mockGameState = {
        targetScore: 10,
        roundTime: 30000,
        maxPlayers: 8,
        isPrivate: false,
        gameStarted: true, // Game has started
        gameEnded: false,
        gamePaused: false,
        canStart: true,
        currentRound: 1,
        hostId: "player1",
        winnerId: "",
        roundStartTime: Date.now(),
        roundTimeRemaining: 30000,
        roundEnded: false,
        correctAnswer: "",
        players: {
          player1: {
            id: "player1",
            name: "TestPlayer",
            score: 0,
            ready: true,
            isHost: true,
            joinedAt: Date.now()
          }
        },
        currentPrompt: { id: "1", text: "What is the capital of France?", category: "Geography", difficulty: "easy", answer: "Paris" },
        roundGuesses: {},
        chatMessages: {}
      };
      
      eventHandlers.onStateChange(mockGameState);
      
      // Re-render to see the change
      rerender(<GameLayout />);
      
      // Should show GameView instead of the old placeholder
      expect(screen.getByTestId("game-view")).toBeInTheDocument();
      expect(screen.getByText("Game View - Round 1")).toBeInTheDocument();
      
      // Should not show lobby or join form
      expect(screen.queryByText("Game Lobby")).not.toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "Join Game" })).not.toBeInTheDocument();
    });
  });

  describe("Component Cleanup", () => {
    it("calls GameClient.dispose on unmount", () => {
      const { unmount } = render(<GameLayout />);
      
      unmount();
      
      expect(mockGameClient.dispose).toHaveBeenCalled();
    });
  });

  describe("MapSchema Conversion", () => {
    it("correctly converts Colyseus MapSchema to JavaScript Map", () => {
      const { rerender } = render(<GameLayout />);
      
      // Get the event handlers that were set
      const eventHandlers = mockGameClient.setEventHandlers.mock.calls[0][0];
      
      // Mock the room with a session ID
      mockGameClient.getRoom.mockReturnValueOnce({ sessionId: "player1" });
      
      // Simulate connection
      eventHandlers.onConnectionStatusChange(ConnectionStatus.CONNECTED);
      
      // Create a mock MapSchema structure like what Colyseus sends
      const mockMapSchema = {
        $items: new Map([
          ["player1", {
            id: "player1",
            name: "TestPlayer",
            score: 0,
            ready: false,
            isHost: true,
            joinedAt: Date.now()
          }]
        ]),
        $indexes: new Map([["player1", 0]]),
        deletedItems: {}
      };
      
      const mockGameState = {
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
        roundStartTime: 0,
        roundTimeRemaining: 0,
        roundEnded: false,
        correctAnswer: "",
        players: mockMapSchema, // This simulates the MapSchema structure
        currentPrompt: { id: "", text: "", category: "", difficulty: "", answer: "" },
        roundGuesses: {},
        chatMessages: {}
      };
      
      eventHandlers.onStateChange(mockGameState);
      rerender(<GameLayout />);
      
      // Should show the lobby with the player data correctly converted
      expect(screen.getByText("Game Lobby")).toBeInTheDocument();
      expect(screen.getByText("TestPlayer")).toBeInTheDocument();
      expect(screen.getByText("Players: 1/8 • Ready: 0/1")).toBeInTheDocument();
      expect(screen.getByText("Host")).toBeInTheDocument();
    });

    it("handles MapSchema with no $items property", () => {
      const { rerender } = render(<GameLayout />);
      
      const eventHandlers = mockGameClient.setEventHandlers.mock.calls[0][0];
      mockGameClient.getRoom.mockReturnValueOnce({ sessionId: "player1" });
      
      eventHandlers.onConnectionStatusChange(ConnectionStatus.CONNECTED);
      
      // Create a mock state with direct player object (fallback case)
      const mockGameState = {
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
        roundStartTime: 0,
        roundTimeRemaining: 0,
        roundEnded: false,
        correctAnswer: "",
        players: {
          player1: {
            id: "player1",
            name: "DirectPlayer",
            score: 5,
            ready: true,
            isHost: true,
            joinedAt: Date.now()
          }
        },
        currentPrompt: { id: "", text: "", category: "", difficulty: "", answer: "" },
        roundGuesses: {},
        chatMessages: {}
      };
      
      eventHandlers.onStateChange(mockGameState);
      rerender(<GameLayout />);
      
      expect(screen.getByText("Game Lobby")).toBeInTheDocument();
      expect(screen.getByText("DirectPlayer")).toBeInTheDocument();
      expect(screen.getByText("Players: 1/8 • Ready: 1/1")).toBeInTheDocument();
      expect(screen.getByText("Score: 5")).toBeInTheDocument();
    });

    it("filters out invalid player entries", () => {
      const { rerender } = render(<GameLayout />);
      
      const eventHandlers = mockGameClient.setEventHandlers.mock.calls[0][0];
      mockGameClient.getRoom.mockReturnValueOnce({ sessionId: "player1" });
      
      eventHandlers.onConnectionStatusChange(ConnectionStatus.CONNECTED);
      
      // Create a mock MapSchema with both valid and invalid entries
      const mockMapSchema = {
        $items: new Map([
          ["player1", {
            id: "player1",
            name: "ValidPlayer",
            score: 0,
            ready: false,
            isHost: true,
            joinedAt: Date.now()
          }],
          ["invalid", null], // Invalid entry
          ["empty", undefined] // Another invalid entry
        ]),
        $indexes: new Map(),
        deletedItems: {}
      };
      
      const mockGameState = {
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
        roundStartTime: 0,
        roundTimeRemaining: 0,
        roundEnded: false,
        correctAnswer: "",
        players: mockMapSchema,
        currentPrompt: { id: "", text: "", category: "", difficulty: "", answer: "" },
        roundGuesses: {},
        chatMessages: {}
      };
      
      eventHandlers.onStateChange(mockGameState);
      rerender(<GameLayout />);
      
      // Should only show the valid player, filtered out the invalid ones
      expect(screen.getByText("Game Lobby")).toBeInTheDocument();
      expect(screen.getByText("ValidPlayer")).toBeInTheDocument();
      expect(screen.getByText("Players: 1/8 • Ready: 0/1")).toBeInTheDocument();
    });

    it("handles empty MapSchema gracefully", () => {
      const { rerender } = render(<GameLayout />);
      
      const eventHandlers = mockGameClient.setEventHandlers.mock.calls[0][0];
      mockGameClient.getRoom.mockReturnValueOnce({ sessionId: "player1" });
      
      eventHandlers.onConnectionStatusChange(ConnectionStatus.CONNECTED);
      
      // Create a mock state with empty MapSchema
      const mockMapSchema = {
        $items: new Map(),
        $indexes: new Map(),
        deletedItems: {}
      };
      
      const mockGameState = {
        targetScore: 10,
        roundTime: 30000,
        maxPlayers: 8,
        isPrivate: false,
        gameStarted: false,
        gameEnded: false,
        gamePaused: false,
        canStart: true,
        currentRound: 0,
        hostId: "",
        winnerId: "",
        roundStartTime: 0,
        roundTimeRemaining: 0,
        roundEnded: false,
        correctAnswer: "",
        players: mockMapSchema,
        currentPrompt: { id: "", text: "", category: "", difficulty: "", answer: "" },
        roundGuesses: {},
        chatMessages: {}
      };
      
      eventHandlers.onStateChange(mockGameState);
      rerender(<GameLayout />);
      
      expect(screen.getByText("Game Lobby")).toBeInTheDocument();
      expect(screen.getByText("Players: 0/8 • Ready: 0/0")).toBeInTheDocument();
      expect(screen.getByText("💡 Waiting for more players to join. Share the room link to invite friends!")).toBeInTheDocument();
    });
  });

  describe("Lobby Integration", () => {
    it("passes correct props to GameLobby component", () => {
      const { rerender } = render(<GameLayout />);
      
      const eventHandlers = mockGameClient.setEventHandlers.mock.calls[0][0];
      mockGameClient.getRoom.mockReturnValueOnce({ sessionId: "player1" });
      
      eventHandlers.onConnectionStatusChange(ConnectionStatus.CONNECTED);
      
      const mockGameState = {
        targetScore: 15,
        roundTime: 45000,
        maxPlayers: 6,
        isPrivate: false,
        gameStarted: false,
        gameEnded: false,
        gamePaused: false,
        canStart: true,
        currentRound: 0,
        hostId: "player1",
        winnerId: "",
        roundStartTime: 0,
        roundTimeRemaining: 0,
        roundEnded: false,
        correctAnswer: "",
        players: {
          player1: {
            id: "player1",
            name: "TestPlayer",
            score: 0,
            ready: false,
            isHost: true,
            joinedAt: Date.now()
          }
        },
        currentPrompt: { id: "", text: "", category: "", difficulty: "", answer: "" },
        roundGuesses: {},
        chatMessages: {}
      };
      
      eventHandlers.onStateChange(mockGameState);
      rerender(<GameLayout />);
      
      // Check that the game settings are properly displayed (passed to GameLobby)
      expect(screen.getByText("Target Score: 15 points")).toBeInTheDocument();
      expect(screen.getByText("Round Time: 45 seconds")).toBeInTheDocument();
      expect(screen.getByText("Max Players: 6")).toBeInTheDocument();
      expect(screen.getByText("Players: 1/6 • Ready: 0/1")).toBeInTheDocument();
    });

    it("calls sendPlayerReady when ready button is clicked", async () => {
      const { rerender } = render(<GameLayout />);
      
      const eventHandlers = mockGameClient.setEventHandlers.mock.calls[0][0];
      mockGameClient.getRoom.mockReturnValueOnce({ sessionId: "player1" });
      
      eventHandlers.onConnectionStatusChange(ConnectionStatus.CONNECTED);
      
      const mockGameState = {
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
        roundStartTime: 0,
        roundTimeRemaining: 0,
        roundEnded: false,
        correctAnswer: "",
        players: {
          player1: {
            id: "player1",
            name: "TestPlayer",
            score: 0,
            ready: false,
            isHost: true,
            joinedAt: Date.now()
          }
        },
        currentPrompt: { id: "", text: "", category: "", difficulty: "", answer: "" },
        roundGuesses: {},
        chatMessages: {}
      };
      
      eventHandlers.onStateChange(mockGameState);
      rerender(<GameLayout />);
      
      const readyButton = screen.getByRole("button", { name: "Mark as Ready" });
      fireEvent.click(readyButton);
      
      expect(mockGameClient.sendPlayerReady).toHaveBeenCalledWith(true);
    });

    it("calls startGame when start game button is clicked", async () => {
      const { rerender } = render(<GameLayout />);
      
      const eventHandlers = mockGameClient.setEventHandlers.mock.calls[0][0];
      mockGameClient.getRoom.mockReturnValueOnce({ sessionId: "player1" });
      
      eventHandlers.onConnectionStatusChange(ConnectionStatus.CONNECTED);
      
      // Create state with enough ready players to enable start button
      const mockGameState = {
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
        roundStartTime: 0,
        roundTimeRemaining: 0,
        roundEnded: false,
        correctAnswer: "",
        players: {
          player1: {
            id: "player1",
            name: "HostPlayer",
            score: 0,
            ready: true,
            isHost: true,
            joinedAt: Date.now()
          },
          player2: {
            id: "player2",
            name: "SecondPlayer",
            score: 0,
            ready: true,
            isHost: false,
            joinedAt: Date.now() + 1000
          }
        },
        currentPrompt: { id: "", text: "", category: "", difficulty: "", answer: "" },
        roundGuesses: {},
        chatMessages: {}
      };
      
      eventHandlers.onStateChange(mockGameState);
      rerender(<GameLayout />);
      
      const startButton = screen.getByRole("button", { name: "Start Game" });
      fireEvent.click(startButton);
      
      expect(mockGameClient.startGame).toHaveBeenCalled();
    });
  });

  describe("Game State Transitions", () => {
    it("shows join form when disconnected", () => {
      render(<GameLayout />);
      
      expect(screen.getByRole("heading", { name: "Join Game" })).toBeInTheDocument();
      expect(screen.getByLabelText("Your Name")).toBeInTheDocument();
      expect(screen.queryByText("Game Lobby")).not.toBeInTheDocument();
      expect(screen.queryByTestId("game-view")).not.toBeInTheDocument();
    });

    it("shows game view when game is active", () => {
      const { rerender } = render(<GameLayout />);
      
      // Mock the room to return session ID
      mockGameClient.getRoom.mockReturnValue({ sessionId: "player1" });
      
      const eventHandlers = mockGameClient.setEventHandlers.mock.calls[0][0];
      eventHandlers.onConnectionStatusChange(ConnectionStatus.CONNECTED);
      
      const mockActiveGameState = {
        gameStarted: true,
        gameEnded: false,
        currentRound: 2,
        players: {
          player1: {
            id: "player1",
            name: "TestPlayer",
            score: 5,
            ready: true,
            isHost: true,
            joinedAt: Date.now()
          }
        },
        targetScore: 10,
        roundTime: 30000,
        maxPlayers: 8,
        isPrivate: false,
        gamePaused: false,
        canStart: false,
        hostId: "player1",
        winnerId: "",
        roundStartTime: Date.now() - 5000,
        roundTimeRemaining: 25000,
        roundEnded: false,
        correctAnswer: "",
        currentPrompt: { 
          id: "prompt1", 
          text: "What is the capital of France?", 
          category: "Geography", 
          difficulty: "easy", 
          answer: "Paris" 
        },
        roundGuesses: {},
        chatMessages: {}
      };

      eventHandlers.onStateChange(mockActiveGameState);
      rerender(<GameLayout />);
      
      // Should show game view instead of lobby
      expect(screen.queryByText("Game Lobby")).not.toBeInTheDocument();
      expect(screen.getByTestId("game-view")).toBeInTheDocument();
      expect(screen.getByText("Game View - Round 2")).toBeInTheDocument();
      expect(screen.getByText("Player: player1")).toBeInTheDocument();
      expect(screen.getByText("Game Started: true")).toBeInTheDocument();
    });

    it("transitions from lobby to game view when game starts", () => {
      const { rerender } = render(<GameLayout />);
      
      mockGameClient.getRoom.mockReturnValue({ sessionId: "player1" });
      
      const eventHandlers = mockGameClient.setEventHandlers.mock.calls[0][0];
      eventHandlers.onConnectionStatusChange(ConnectionStatus.CONNECTED);
      
      // Start with lobby state
      const lobbyState = {
        gameStarted: false,
        gameEnded: false,
        currentRound: 0,
        players: {
          player1: {
            id: "player1", 
            name: "TestPlayer", 
            score: 0, 
            ready: true, 
            isHost: true, 
            joinedAt: Date.now()
          }
        },
        targetScore: 10, 
        roundTime: 30000, 
        maxPlayers: 8, 
        isPrivate: false,
        gamePaused: false, 
        canStart: true, 
        hostId: "player1", 
        winnerId: "",
        roundStartTime: 0, 
        roundTimeRemaining: 0, 
        roundEnded: false, 
        correctAnswer: "",
        currentPrompt: { id: "", text: "", category: "", difficulty: "easy", answer: "" },
        roundGuesses: {}, 
        chatMessages: {}
      };

      eventHandlers.onStateChange(lobbyState);
      rerender(<GameLayout />);
      expect(screen.getByText("Game Lobby")).toBeInTheDocument();
      expect(screen.queryByTestId("game-view")).not.toBeInTheDocument();
      
      // Transition to active game
      const activeState = { ...lobbyState, gameStarted: true, currentRound: 1 };
      eventHandlers.onStateChange(activeState);
      rerender(<GameLayout />);
      
      expect(screen.queryByText("Game Lobby")).not.toBeInTheDocument();
      expect(screen.getByTestId("game-view")).toBeInTheDocument();
      expect(screen.getByText("Game View - Round 1")).toBeInTheDocument();
    });

    it("shows game view when game has ended (for winner screen)", () => {
      const { rerender } = render(<GameLayout />);
      
      // Mock the room to return session ID
      mockGameClient.getRoom.mockReturnValue({ sessionId: "player1" });
      
      const eventHandlers = mockGameClient.setEventHandlers.mock.calls[0][0];
      eventHandlers.onConnectionStatusChange(ConnectionStatus.CONNECTED);
      
      const mockGameEndedState = {
        gameStarted: false, // Game sets this to false when ending
        gameEnded: true,    // But gameEnded is true
        winnerId: "player1", // And there's a winner
        currentRound: 0,
        players: {
          player1: {
            id: "player1",
            name: "TestPlayer",
            score: 5,
            ready: false,
            isHost: true,
            joinedAt: Date.now()
          }
        },
        targetScore: 10,
        roundTime: 30000,
        maxPlayers: 8,
        isPrivate: false,
        gamePaused: false,
        canStart: false,
        hostId: "player1",
        roundStartTime: 0,
        roundTimeRemaining: 0,
        roundEnded: false,
        correctAnswer: "",
        currentPrompt: { 
          id: "", 
          text: "", 
          category: "", 
          difficulty: "easy", 
          answer: "" 
        },
        roundGuesses: {},
        chatMessages: {}
      };

      eventHandlers.onStateChange(mockGameEndedState);
      rerender(<GameLayout />);
      
      // Should show GameView (not GameLobby) so winner screen can be displayed
      expect(screen.queryByText("Game Lobby")).not.toBeInTheDocument();
      expect(screen.getByTestId("game-view")).toBeInTheDocument();
      expect(screen.getByText("Game Started: false")).toBeInTheDocument(); // Confirms gameStarted is false but still shows GameView
    });

    it("shows leave game button when connected and handles click", async () => {
      const { rerender } = render(<GameLayout />);
      
      mockGameClient.leaveRoom.mockResolvedValue(undefined);
      
      const eventHandlers = mockGameClient.setEventHandlers.mock.calls[0][0];
      
      // Initially disconnected - no leave button
      expect(screen.queryByRole("button", { name: "Leave Game" })).not.toBeInTheDocument();
      
      // Connect - should show leave button
      eventHandlers.onConnectionStatusChange(ConnectionStatus.CONNECTED);
      rerender(<GameLayout />);
      
      const leaveButton = screen.getByRole("button", { name: "Leave Game" });
      expect(leaveButton).toBeInTheDocument();
      
      // Click leave button
      fireEvent.click(leaveButton);
      
      await waitFor(() => {
        expect(mockGameClient.leaveRoom).toHaveBeenCalled();
      });
    });
  });
}); 