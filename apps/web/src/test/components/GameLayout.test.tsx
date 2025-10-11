import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GameLayout, GameLayoutProps } from "../../app/components/GameLayout";
import { ConnectionStatus } from "../../lib/gameClient";
import { GameState, PlayerData, GameStatus } from "@shared/index";

// Mock the UserDisplayName component to avoid context requirements
vi.mock("../../app/components/UserDisplayName", () => ({
  UserDisplayName: vi.fn(() => <div data-testid="user-display-name">User</div>)
}));

// Mock the GameView component
vi.mock("../../app/components/GameView", () => ({
  GameView: vi.fn(({ 
    gameState, 
    currentPlayerId, 
    onSubmitGuess, 
    onSendChatMessage, 
    onStartGame,
    onSetTopics,
    onSetDifficulty,
    onSetTargetScore,
    onSetRoundTime,
    onSetMaxPlayers
  }) => (
    <div data-testid="game-view">
      <div>Game View</div>
      <div>Player: {currentPlayerId}</div>
      <div>Status: {gameState?.gameStatus}</div>
      <div>Round: {gameState?.currentRound || 0}</div>
      {onSubmitGuess && <button onClick={() => onSubmitGuess("test guess")}>Submit Guess</button>}
      {onSendChatMessage && <button onClick={() => onSendChatMessage("test message")}>Send Message</button>}
      {onStartGame && <button onClick={() => onStartGame()}>Start Game</button>}
      {onSetTopics && <button onClick={() => onSetTopics(["Topic1", "Topic2"])}>Set Topics</button>}
      {onSetDifficulty && <button onClick={() => onSetDifficulty(5)}>Set Difficulty</button>}
      {onSetTargetScore && <button onClick={() => onSetTargetScore(20)}>Set Target Score</button>}
      {onSetRoundTime && <button onClick={() => onSetRoundTime(60)}>Set Round Time</button>}
      {onSetMaxPlayers && <button onClick={() => onSetMaxPlayers(10)}>Set Max Players</button>}
    </div>
  ))
}));

describe("GameLayout", () => {
  // Mock functions for props
  const mockProps: GameLayoutProps = {
    connectionStatus: ConnectionStatus.DISCONNECTED,
    gameState: null,
    currentPlayerId: "player1",
    onLeaveGame: vi.fn(),
    onStartGame: vi.fn(),
    onSubmitGuess: vi.fn(),
    onSetTopics: vi.fn(),
    onSetDifficulty: vi.fn(),
    onSetTargetScore: vi.fn(),
    onSetRoundTime: vi.fn(),
    onSetMaxPlayers: vi.fn(),
    onSendChatMessage: vi.fn(),
  };

  const createTestGameState = (overrides: Partial<GameState> = {}): GameState => ({
    targetScore: 10,
    roundTime: 30000,
    defaultRoundTime: 30000,
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
    // roundTimeRemaining: removed - clients calculate locally using event-driven timer system
    roundEnded: false,
    correctAnswer: "",
    topics: ["Test Topic"],
    currentTopic: "Test Topic",
    currentTopicIndex: 0,
    currentDifficulty: 5,
    players: new Map([
      ["player1", {
        id: "player1",
        name: "TestPlayer",
        score: 0,
        ready: false,
        isHost: true,
        joinedAt: Date.now(),
      } as PlayerData]
    ]),
    currentPrompt: {
      id: "prompt1",
      text: "Test question?",
      category: "test",
      difficulty: "medium" as const,
      answer: "test answer"
    },
    roundGuesses: new Map(),
    playerIncorrectGuesses: new Map(),
    chatMessages: new Map(),
    ...overrides
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Header and Layout", () => {
    it("renders the header with game title", () => {
      render(<GameLayout {...mockProps} />);
      expect(screen.getByRole("heading", { name: "Quivio", level: 1 })).toBeInTheDocument();
    });

    it("shows connection status in header", () => {
      render(<GameLayout {...mockProps} connectionStatus={ConnectionStatus.CONNECTED} />);
      expect(screen.getByText("Connected")).toBeInTheDocument();
    });

    it("shows leave game button when connected", () => {
      render(<GameLayout {...mockProps} connectionStatus={ConnectionStatus.CONNECTED} />);
      expect(screen.getByRole("button", { name: "Leave Game" })).toBeInTheDocument();
    });

    it("hides leave game button when disconnected", () => {
      render(<GameLayout {...mockProps} connectionStatus={ConnectionStatus.DISCONNECTED} />);
      expect(screen.queryByRole("button", { name: "Leave Game" })).not.toBeInTheDocument();
    });

    it("calls onLeaveGame when leave button is clicked", () => {
      render(<GameLayout {...mockProps} connectionStatus={ConnectionStatus.CONNECTED} />);
      
      const leaveButton = screen.getByRole("button", { name: "Leave Game" });
      fireEvent.click(leaveButton);
      
      expect(mockProps.onLeaveGame).toHaveBeenCalledTimes(1);
    });
  });

  describe("Connection Status Display", () => {
    it("shows correct status text and color for disconnected", () => {
      render(<GameLayout {...mockProps} connectionStatus={ConnectionStatus.DISCONNECTED} />);
      
      expect(screen.getByText("Disconnected")).toBeInTheDocument();
      const statusIndicator = document.querySelector('.bg-gray-500');
      expect(statusIndicator).toBeInTheDocument();
    });

    it("shows correct status text and color for connecting", () => {
      render(<GameLayout {...mockProps} connectionStatus={ConnectionStatus.CONNECTING} />);
      
      // Check the header status specifically by looking within the header
      const header = screen.getByRole("banner");
      expect(header).toHaveTextContent("Connecting...");
      const statusIndicator = document.querySelector('.bg-yellow-500');
      expect(statusIndicator).toBeInTheDocument();
    });

    it("shows correct status text and color for connected", () => {
      render(<GameLayout {...mockProps} connectionStatus={ConnectionStatus.CONNECTED} />);
      
      expect(screen.getByText("Connected")).toBeInTheDocument();
      const statusIndicator = document.querySelector('.bg-green-500');
      expect(statusIndicator).toBeInTheDocument();
    });

    // Removed RECONNECTING test - Colyseus handles reconnection internally

    it("shows correct status text and color for error", () => {
      render(<GameLayout {...mockProps} connectionStatus={ConnectionStatus.ERROR} />);
      
      expect(screen.getByText("Connection Error")).toBeInTheDocument();
      const statusIndicator = document.querySelector('.bg-red-500');
      expect(statusIndicator).toBeInTheDocument();
    });
  });

  describe("Content Rendering Based on State", () => {
    it("shows connecting message when not connected", () => {
      render(<GameLayout {...mockProps} connectionStatus={ConnectionStatus.CONNECTING} />);
      
      // Check the main content area specifically by looking for the accompanying text
      expect(screen.getByText("Please wait while we connect you to the game.")).toBeInTheDocument();
      // Check that we have the connecting message in main content by looking within main
      const main = screen.getByRole("main");
      expect(main).toHaveTextContent("Connecting...");
    });

    it("shows connecting message when connected but no game state", () => {
      render(<GameLayout {...mockProps} connectionStatus={ConnectionStatus.CONNECTED} gameState={null} />);
      
      expect(screen.getByText("Connecting...")).toBeInTheDocument();
      expect(screen.getByText("Please wait while we connect you to the game.")).toBeInTheDocument();
    });

    it("shows GameView with lobby state when connected with game state", () => {
      const gameState = createTestGameState({ gameStatus: GameStatus.WAITING });
      
      render(<GameLayout {...mockProps} 
        connectionStatus={ConnectionStatus.CONNECTED} 
        gameState={gameState} 
      />);
      
      expect(screen.getByTestId("game-view")).toBeInTheDocument();
      expect(screen.getByText("Status: waiting")).toBeInTheDocument();
    });

    it("shows GameView when game is in progress", () => {
      const gameState = createTestGameState({ gameStatus: GameStatus.IN_PROGRESS });
      
      render(<GameLayout {...mockProps} 
        connectionStatus={ConnectionStatus.CONNECTED} 
        gameState={gameState} 
      />);
      
      expect(screen.getByTestId("game-view")).toBeInTheDocument();
      expect(screen.getByText("Status: in_progress")).toBeInTheDocument();
    });

    it("shows GameView when game has ended", () => {
      const gameState = createTestGameState({ gameStatus: GameStatus.GAME_ENDED });
      
      render(<GameLayout {...mockProps} 
        connectionStatus={ConnectionStatus.CONNECTED} 
        gameState={gameState} 
      />);
      
      expect(screen.getByTestId("game-view")).toBeInTheDocument();
      expect(screen.getByText("Status: game_ended")).toBeInTheDocument();
    });
  });

  describe("GameView Integration", () => {
    it("passes correct props to GameView", () => {
      const gameState = createTestGameState({ currentRound: 3 });
      
      render(<GameLayout {...mockProps} 
        connectionStatus={ConnectionStatus.CONNECTED} 
        gameState={gameState} 
        currentPlayerId="player1"
      />);
      
      const gameView = screen.getByTestId("game-view");
      expect(gameView).toHaveTextContent("Player: player1");
      expect(gameView).toHaveTextContent("Round: 3");
    });

    it("calls onSubmitGuess when guess is submitted", () => {
      const gameState = createTestGameState({ gameStatus: GameStatus.IN_PROGRESS });
      
      render(<GameLayout {...mockProps} 
        connectionStatus={ConnectionStatus.CONNECTED} 
        gameState={gameState} 
      />);
      
      const guessButton = screen.getByRole("button", { name: "Submit Guess" });
      fireEvent.click(guessButton);
      
      expect(mockProps.onSubmitGuess).toHaveBeenCalledWith("test guess");
    });

    it("calls onSendChatMessage when message is sent", () => {
      const gameState = createTestGameState({ gameStatus: GameStatus.IN_PROGRESS });
      
      render(<GameLayout {...mockProps} 
        connectionStatus={ConnectionStatus.CONNECTED} 
        gameState={gameState} 
      />);
      
      const chatButton = screen.getByRole("button", { name: "Send Message" });
      fireEvent.click(chatButton);
      
      expect(mockProps.onSendChatMessage).toHaveBeenCalledWith("test message");
    });
  });

  describe("Lobby Actions Integration", () => {
    it("calls onStartGame when start game button clicked", () => {
      const gameState = createTestGameState({ gameStatus: GameStatus.WAITING });
      
      render(<GameLayout {...mockProps} 
        connectionStatus={ConnectionStatus.CONNECTED} 
        gameState={gameState} 
      />);
      
      const startButton = screen.getByRole("button", { name: "Start Game" });
      fireEvent.click(startButton);
      
      expect(mockProps.onStartGame).toHaveBeenCalledTimes(1);
    });

    // Single-topic callback removed; topics are managed via onSetTopics only

    it("calls onSetTopics when topics are set", () => {
      const gameState = createTestGameState({ gameStatus: GameStatus.WAITING });
      
      render(<GameLayout {...mockProps} 
        connectionStatus={ConnectionStatus.CONNECTED} 
        gameState={gameState} 
      />);
      
      const topicsButton = screen.getByRole("button", { name: "Set Topics" });
      fireEvent.click(topicsButton);
      
      expect(mockProps.onSetTopics).toHaveBeenCalledWith(["Topic1", "Topic2"]);
    });

    it("calls onSetDifficulty when difficulty is set", () => {
      const gameState = createTestGameState({ gameStatus: GameStatus.WAITING });
      
      render(<GameLayout {...mockProps} 
        connectionStatus={ConnectionStatus.CONNECTED} 
        gameState={gameState} 
      />);
      
      const difficultyButton = screen.getByRole("button", { name: "Set Difficulty" });
      fireEvent.click(difficultyButton);
      
      expect(mockProps.onSetDifficulty).toHaveBeenCalledWith(5);
    });

    it("calls onSetTargetScore when target score is set", () => {
      const gameState = createTestGameState({ gameStatus: GameStatus.WAITING });
      
      render(<GameLayout {...mockProps} 
        connectionStatus={ConnectionStatus.CONNECTED} 
        gameState={gameState} 
      />);
      
      const targetScoreButton = screen.getByRole("button", { name: "Set Target Score" });
      fireEvent.click(targetScoreButton);
      
      expect(mockProps.onSetTargetScore).toHaveBeenCalledWith(20);
    });

    it("calls onSetRoundTime when round time is set", () => {
      const gameState = createTestGameState({ gameStatus: GameStatus.WAITING });
      
      render(<GameLayout {...mockProps} 
        connectionStatus={ConnectionStatus.CONNECTED} 
        gameState={gameState} 
      />);
      
      const roundTimeButton = screen.getByRole("button", { name: "Set Round Time" });
      fireEvent.click(roundTimeButton);
      
      expect(mockProps.onSetRoundTime).toHaveBeenCalledWith(60);
    });

    it("calls onSetMaxPlayers when max players is set", () => {
      const gameState = createTestGameState({ gameStatus: GameStatus.WAITING });
      
      render(<GameLayout {...mockProps} 
        connectionStatus={ConnectionStatus.CONNECTED} 
        gameState={gameState} 
      />);
      
      const maxPlayersButton = screen.getByRole("button", { name: "Set Max Players" });
      fireEvent.click(maxPlayersButton);
      
      expect(mockProps.onSetMaxPlayers).toHaveBeenCalledWith(10);
    });
  });

  describe("Edge Cases", () => {
    it("handles null gameState gracefully", () => {
      render(<GameLayout {...mockProps} 
        connectionStatus={ConnectionStatus.CONNECTED} 
        gameState={null} 
      />);
      
      expect(screen.getByText("Connecting...")).toBeInTheDocument();
    });

    it("handles undefined currentPlayerId", () => {
      const gameState = createTestGameState({ gameStatus: GameStatus.WAITING });
      
      render(<GameLayout {...mockProps} 
        connectionStatus={ConnectionStatus.CONNECTED} 
        gameState={gameState} 
        currentPlayerId=""
      />);
      
      expect(screen.getByTestId("game-view")).toBeInTheDocument();
      expect(screen.getByText(/Player:/)).toBeInTheDocument();
    });

    it("renders GameView for all game states", () => {
      const gameState = createTestGameState({ gameStatus: GameStatus.IN_PROGRESS });
      
      render(<GameLayout {...mockProps} 
        connectionStatus={ConnectionStatus.CONNECTED} 
        gameState={gameState} 
      />);
      
      expect(screen.getByTestId("game-view")).toBeInTheDocument();
    });
  });
}); 
