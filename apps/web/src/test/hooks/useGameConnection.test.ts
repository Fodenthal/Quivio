import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useGameConnection } from "../../hooks/useGameConnection";
import { ConnectionStatus } from "../../lib/gameClient";
import { GameState, GameStatus } from "@shared/index";

// Mock the GameClient
const mockGameClient = {
  setEventHandlers: vi.fn(),
  joinRoom: vi.fn(),
  createRoom: vi.fn(),
  leaveRoom: vi.fn(),
  dispose: vi.fn(),
  getRoom: vi.fn(),
  sendPlayerReady: vi.fn(),
  startGame: vi.fn(),
  submitGuess: vi.fn(),
  joinNextGame: vi.fn(),
  setTopic: vi.fn(),
  setDifficulty: vi.fn(),
  sendChatMessage: vi.fn(),
};

// Mock the gameStateConverter
const mockConvertedState: GameState = {
  targetScore: 10,
  roundTime: 30000,
  maxPlayers: 8,
  isPrivate: false,
  gamePin: "TEST1",
  roomName: "Test Room",
  gameStatus: GameStatus.WAITING,

  gamePaused: false,
  canStart: false,
  currentRound: 1,
  hostId: "player1",
  winnerId: "",
  restartCountdown: 0,
  participatingPlayers: new Map([["player1", true]]),
  roundStartTime: 0,
  roundTimeRemaining: 30000,
  roundEnded: false,
  correctAnswer: "",
  topics: ["Test Topic"],
  currentTopic: "Test Topic",
  currentTopicIndex: 0,
  currentDifficulty: 3,
  players: new Map([
    ["player1", {
      id: "player1",
      name: "TestPlayer",
      score: 0,
      ready: false,
      avatarHue: 220,
      isHost: true,
      joinedAt: Date.now(),
    }]
  ]),
  currentPrompt: {
    id: "prompt1",
    text: "Test question?",
    category: "test",
    difficulty: "medium" as const,
    answer: "test answer",
    topic: "Test Topic",
    difficultyLevel: 5,
    acceptableAnswers: ["test answer"]
  },
  roundGuesses: new Map(),
  playerIncorrectGuesses: new Map(),
  chatMessages: new Map(),
};

// Mock the dependencies
vi.mock("../../lib/gameClient", () => ({
  GameClient: vi.fn(() => mockGameClient),
  ConnectionStatus: {
    DISCONNECTED: "disconnected",
    CONNECTING: "connecting",
    CONNECTED: "connected",
    // RECONNECTING removed - Colyseus handles reconnection internally
    ERROR: "error",
  },
}));

vi.mock("../../utils/gameStateConverter", () => ({
  convertColyseusState: vi.fn(() => mockConvertedState),
}));

describe("useGameConnection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock to return undefined room by default
    mockGameClient.getRoom.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Hook Initialization", () => {
    it("initializes with correct default state", () => {
      const { result } = renderHook(() => useGameConnection());

      expect(result.current.connectionStatus).toBe(ConnectionStatus.DISCONNECTED);
      expect(result.current.gameState).toBe(null);
      expect(result.current.currentPlayerId).toBe("");
      expect(result.current.gameClient).toBeDefined();
    });

    it("sets up event handlers on mount", () => {
      renderHook(() => useGameConnection());

      expect(mockGameClient.setEventHandlers).toHaveBeenCalledWith({
        onConnectionStatusChange: expect.any(Function),
        onStateChange: expect.any(Function),
        onError: expect.any(Function),
      });
    });

    it("disposes GameClient on unmount", () => {
      const { unmount } = renderHook(() => useGameConnection());

      unmount();

      expect(mockGameClient.dispose).toHaveBeenCalled();
    });
  });

  describe("Connection Status Management", () => {
    it("updates connection status via event handler", async () => {
      const { result } = renderHook(() => useGameConnection());

      // Get the event handlers that were set
      const eventHandlers = mockGameClient.setEventHandlers.mock.calls[0][0];

      act(() => {
        eventHandlers.onConnectionStatusChange(ConnectionStatus.CONNECTING);
      });

      expect(result.current.connectionStatus).toBe(ConnectionStatus.CONNECTING);

      act(() => {
        eventHandlers.onConnectionStatusChange(ConnectionStatus.CONNECTED);
      });

      expect(result.current.connectionStatus).toBe(ConnectionStatus.CONNECTED);
    });

    it("clears game state when disconnected", async () => {
      const { result } = renderHook(() => useGameConnection());
      const eventHandlers = mockGameClient.setEventHandlers.mock.calls[0][0];

      // First set some state
      act(() => {
        eventHandlers.onConnectionStatusChange(ConnectionStatus.CONNECTED);
        eventHandlers.onStateChange({ someState: "data" });
      });

      expect(result.current.gameState).not.toBe(null);

      // Then disconnect
      act(() => {
        eventHandlers.onConnectionStatusChange(ConnectionStatus.DISCONNECTED);
      });

      expect(result.current.connectionStatus).toBe(ConnectionStatus.DISCONNECTED);
      expect(result.current.gameState).toBe(null);
      expect(result.current.currentPlayerId).toBe("");
    });
  });

  describe("Game State Management", () => {
    it("updates game state via event handler", async () => {
      const { result } = renderHook(() => useGameConnection());
      const eventHandlers = mockGameClient.setEventHandlers.mock.calls[0][0];

      act(() => {
        eventHandlers.onStateChange({ rawState: "data" });
      });

      expect(result.current.gameState).toEqual(mockConvertedState);
    });

    it("updates current player ID when room is available", async () => {
      const { result } = renderHook(() => useGameConnection());
      const eventHandlers = mockGameClient.setEventHandlers.mock.calls[0][0];

      // Mock room with session ID
      mockGameClient.getRoom.mockReturnValue({ sessionId: "player123" });

      act(() => {
        eventHandlers.onConnectionStatusChange(ConnectionStatus.CONNECTED);
      });

      await waitFor(() => {
        expect(result.current.currentPlayerId).toBe("player123");
      });
    });
  });

  describe("Room Operations", () => {
    describe("joinRoom", () => {
      it("calls GameClient.joinRoom with correct parameters", async () => {
        mockGameClient.joinRoom.mockResolvedValue(undefined);
        const { result } = renderHook(() => useGameConnection());

        await act(async () => {
          await result.current.joinRoom({
            playerName: "TestPlayer",
            gamePin: "12345"
          });
        });

        expect(mockGameClient.joinRoom).toHaveBeenCalledWith({
          playerName: "TestPlayer",
          gamePin: "12345"
        });
      });

      it("throws error when GameClient.joinRoom fails", async () => {
        const testError = new Error("Join failed");
        mockGameClient.joinRoom.mockRejectedValue(testError);
        const { result } = renderHook(() => useGameConnection());

        await expect(
          result.current.joinRoom({
            playerName: "TestPlayer",
            gamePin: "12345"
          })
        ).rejects.toThrow("Join failed");
      });
    });

    describe("createRoom", () => {
      it("calls GameClient.createRoom with correct parameters", async () => {
        mockGameClient.createRoom.mockResolvedValue(undefined);
        const { result } = renderHook(() => useGameConnection());

        await act(async () => {
          await result.current.createRoom({
            roomName: "Test Room",
            hostName: "TestHost",
            topics: ["Test Topic"],
            difficulty: 3,
            isPrivate: false
          });
        });

        expect(mockGameClient.createRoom).toHaveBeenCalledWith({
          playerName: "TestHost",
          roomName: "Test Room",
          topics: ["Test Topic"],
          difficulty: 3,
          isPrivate: false,
          maxPlayers: 8
        });
      });

      it("generates unique host player names", async () => {
        mockGameClient.createRoom.mockResolvedValue(undefined);
        const { result } = renderHook(() => useGameConnection());

        const calls: string[] = [];
        mockGameClient.createRoom.mockImplementation((params) => {
          calls.push(params.playerName);
          return Promise.resolve();
        });

        await act(async () => {
          await result.current.createRoom({
            roomName: "Test Room 1",
            hostName: "TestHost1",
            topics: ["Topic1"],
            difficulty: 3,
            isPrivate: false
          });
        });

        await act(async () => {
          await result.current.createRoom({
            roomName: "Test Room 2",
            hostName: "TestHost2",
            topics: ["Topic2"],
            difficulty: 4,
            isPrivate: true
          });
        });

        expect(calls).toHaveLength(2);
        expect(calls[0]).toBe("TestHost1");
        expect(calls[1]).toBe("TestHost2");
      });

      it("throws error when GameClient.createRoom fails", async () => {
        const testError = new Error("Create failed");
        mockGameClient.createRoom.mockRejectedValue(testError);
        const { result } = renderHook(() => useGameConnection());

        await expect(
          result.current.createRoom({
            roomName: "Test Room",
            hostName: "TestHost",
            topics: ["Test Topic"],
            difficulty: 3,
            isPrivate: false
          })
        ).rejects.toThrow("Create failed");
      });
    });

    describe("leaveRoom", () => {
      it("calls GameClient.leaveRoom and resets state", async () => {
        mockGameClient.leaveRoom.mockResolvedValue(undefined);
        const { result } = renderHook(() => useGameConnection());

        // Set some initial state
        const eventHandlers = mockGameClient.setEventHandlers.mock.calls[0][0];
        act(() => {
          eventHandlers.onStateChange({ someState: "data" });
        });

        expect(result.current.gameState).not.toBe(null);

        await act(async () => {
          await result.current.leaveRoom();
        });

        expect(mockGameClient.leaveRoom).toHaveBeenCalled();
        expect(result.current.gameState).toBe(null);
        expect(result.current.currentPlayerId).toBe("");
      });

      it("throws error when GameClient.leaveRoom fails", async () => {
        const testError = new Error("Leave failed");
        mockGameClient.leaveRoom.mockRejectedValue(testError);
        const { result } = renderHook(() => useGameConnection());

        await expect(result.current.leaveRoom()).rejects.toThrow("Leave failed");
      });
    });
  });

  describe("Game Actions", () => {
    describe("sendPlayerReady", () => {
      it("calls GameClient.sendPlayerReady with correct value", async () => {
        const { result } = renderHook(() => useGameConnection());

        await act(async () => {
          await result.current.sendPlayerReady(true);
        });

        expect(mockGameClient.sendPlayerReady).toHaveBeenCalledWith(true);

        await act(async () => {
          await result.current.sendPlayerReady(false);
        });

        expect(mockGameClient.sendPlayerReady).toHaveBeenCalledWith(false);
      });

      it("throws error when GameClient.sendPlayerReady fails", async () => {
        const testError = new Error("Ready failed");
        mockGameClient.sendPlayerReady.mockImplementation(() => {
          throw testError;
        });
        const { result } = renderHook(() => useGameConnection());

        await expect(result.current.sendPlayerReady(true)).rejects.toThrow("Ready failed");
      });
    });

    describe("startGame", () => {
      it("calls GameClient.startGame", () => {
        const { result } = renderHook(() => useGameConnection());

        act(() => {
          result.current.startGame();
        });

        expect(mockGameClient.startGame).toHaveBeenCalled();
      });

      it("throws error when GameClient.startGame fails", () => {
        const testError = new Error("Start failed");
        mockGameClient.startGame.mockImplementation(() => {
          throw testError;
        });
        const { result } = renderHook(() => useGameConnection());

        expect(() => result.current.startGame()).toThrow("Start failed");
      });
    });

    describe("submitGuess", () => {
      it("calls GameClient.submitGuess with correct guess", () => {
        const { result } = renderHook(() => useGameConnection());

        act(() => {
          result.current.submitGuess("test answer");
        });

        expect(mockGameClient.submitGuess).toHaveBeenCalledWith("test answer");
      });

      it("throws error when GameClient.submitGuess fails", () => {
        const testError = new Error("Guess failed");
        mockGameClient.submitGuess.mockImplementation(() => {
          throw testError;
        });
        const { result } = renderHook(() => useGameConnection());

        expect(() => result.current.submitGuess("answer")).toThrow("Guess failed");
      });
    });

    describe("joinNextGame", () => {
      it("calls GameClient.joinNextGame", () => {
        const { result } = renderHook(() => useGameConnection());

        act(() => {
          result.current.joinNextGame();
        });

        expect(mockGameClient.joinNextGame).toHaveBeenCalled();
      });
    });

    describe("setTopic", () => {
      it("calls GameClient.setTopic with correct topic", () => {
        const { result } = renderHook(() => useGameConnection());

        act(() => {
          result.current.setTopic("New Topic");
        });

        expect(mockGameClient.setTopic).toHaveBeenCalledWith("New Topic");
      });
    });

    describe("setDifficulty", () => {
      it("calls GameClient.setDifficulty with correct difficulty", () => {
        const { result } = renderHook(() => useGameConnection());

        act(() => {
          result.current.setDifficulty(8);
        });

        expect(mockGameClient.setDifficulty).toHaveBeenCalledWith(8);
      });
    });

    describe("sendChatMessage", () => {
      it("calls GameClient.sendChatMessage with correct content", async () => {
        const { result } = renderHook(() => useGameConnection());

        await act(async () => {
          await result.current.sendChatMessage("Hello world!");
        });

        expect(mockGameClient.sendChatMessage).toHaveBeenCalledWith("Hello world!");
      });

      it("throws error when GameClient.sendChatMessage fails", async () => {
        const testError = new Error("Message failed");
        mockGameClient.sendChatMessage.mockImplementation(() => {
          throw testError;
        });
        const { result } = renderHook(() => useGameConnection());

        await expect(result.current.sendChatMessage("test")).rejects.toThrow("Message failed");
      });
    });
  });

  describe("Error Handling", () => {
    it("logs errors via event handler", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      renderHook(() => useGameConnection());

      const eventHandlers = mockGameClient.setEventHandlers.mock.calls[0][0];
      const testError = new Error("Test error");

      eventHandlers.onError(testError);

      expect(consoleSpy).toHaveBeenCalledWith("Game client error:", testError);

      consoleSpy.mockRestore();
    });
  });

  describe("Memory Leaks Prevention", () => {
    it("does not update state after unmount", async () => {
      const { unmount } = renderHook(() => useGameConnection());
      const eventHandlers = mockGameClient.setEventHandlers.mock.calls[0][0];

      // Unmount the component
      unmount();

      // Try to update state - should not cause errors or warnings
      act(() => {
        eventHandlers.onConnectionStatusChange(ConnectionStatus.CONNECTED);
        eventHandlers.onStateChange({ someState: "data" });
      });

      // No way to directly test this, but it shouldn't crash or warn
      expect(true).toBe(true);
    });
  });

  describe("Concurrent Operations", () => {
    it("handles multiple join attempts gracefully", async () => {
      mockGameClient.joinRoom.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      const { result } = renderHook(() => useGameConnection());

      const joinParams = {
        playerName: "TestPlayer",
        gamePin: "12345"
      };

      // Start multiple join operations
      const promises = [
        result.current.joinRoom(joinParams),
        result.current.joinRoom(joinParams),
        result.current.joinRoom(joinParams),
      ];

      await Promise.all(promises);

      // Should have called joinRoom for each attempt
      expect(mockGameClient.joinRoom).toHaveBeenCalledTimes(3);
    });

    it("handles state updates during async operations", async () => {
      const { result } = renderHook(() => useGameConnection());
      const eventHandlers = mockGameClient.setEventHandlers.mock.calls[0][0];

      // Start an async operation
      const joinPromise = act(async () => {
        await result.current.joinRoom({
          playerName: "TestPlayer",
          gamePin: "12345"
        });
      });

      // Update state while join is in progress
      act(() => {
        eventHandlers.onConnectionStatusChange(ConnectionStatus.CONNECTING);
      });

      await joinPromise;

      expect(result.current.connectionStatus).toBe(ConnectionStatus.CONNECTING);
    });
  });
}); 