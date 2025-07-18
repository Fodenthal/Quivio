import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GameLayout, GameLayoutProps } from "../../app/components/GameLayout";
import { ConnectionStatus } from "../../lib/gameClient";
import { GameState, PlayerData } from "@shared/index";

// Mock the child components
vi.mock("../../app/components/GameLobby", () => ({
  GameLobby: vi.fn(({ gameState, currentPlayerId, onPlayerReady, onStartGame, onSetTopic, onSetDifficulty }) => (
    <div data-testid="game-lobby">
      <div>Game Lobby</div>
      <div>Player: {currentPlayerId}</div>
      <div>Game Started: {gameState.gameStarted.toString()}</div>
      <button onClick={() => onPlayerReady(true)}>Ready</button>
      <button onClick={() => onStartGame()}>Start Game</button>
      <button onClick={() => onSetTopic("Test Topic")}>Set Topic</button>
      <button onClick={() => onSetDifficulty(5)}>Set Difficulty</button>
    </div>
  ))
}));

vi.mock("../../app/components/GameView", () => ({
  GameView: vi.fn(({ gameState, currentPlayerId, onSubmitGuess, onJoinNextGame, onSendChatMessage }) => (
    <div data-testid="game-view">
      <div>Game View</div>
      <div>Player: {currentPlayerId}</div>
      <div>Round: {gameState.currentRound}</div>
      <button onClick={() => onSubmitGuess("test guess")}>Submit Guess</button>
      <button onClick={() => onJoinNextGame()}>Join Next Game</button>
      <button onClick={() => onSendChatMessage("test message")}>Send Message</button>
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
    onPlayerReady: vi.fn(),
    onStartGame: vi.fn(),
    onSubmitGuess: vi.fn(),
    onJoinNextGame: vi.fn(),
    onSetTopic: vi.fn(),
    onSetDifficulty: vi.fn(),
    onSendChatMessage: vi.fn(),
  };

  const createTestGameState = (overrides: Partial<GameState> = {}): GameState => ({
    targetScore: 10,
    roundTime: 30000,
    maxPlayers: 8,
    isPrivate: false,
    gamePin: "TEST1",
    gameStarted: false,
    gameEnded: false,
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
    currentTopic: "Test Topic",
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
      answer: "test answer",
      topic: "Test Topic",
      difficultyLevel: 5,
      acceptableAnswers: ["test answer"]
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
      expect(screen.getByRole("heading", { name: "PopReplay", level: 1 })).toBeInTheDocument();
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

    it("shows correct status text and color for reconnecting", () => {
      render(<GameLayout {...mockProps} connectionStatus={ConnectionStatus.RECONNECTING} />);
      
      expect(screen.getByText("Reconnecting...")).toBeInTheDocument();
      const statusIndicator = document.querySelector('.bg-yellow-500');
      expect(statusIndicator).toBeInTheDocument();
    });

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

    it("shows lobby when connected with game state but game not started", () => {
      const gameState = createTestGameState({ gameStarted: false, gameEnded: false });
      
      render(<GameLayout {...mockProps} 
        connectionStatus={ConnectionStatus.CONNECTED} 
        gameState={gameState} 
      />);
      
      expect(screen.getByTestId("game-lobby")).toBeInTheDocument();
      expect(screen.queryByTestId("game-view")).not.toBeInTheDocument();
    });

    it("shows game view when game has started", () => {
      const gameState = createTestGameState({ gameStarted: true, gameEnded: false });
      
      render(<GameLayout {...mockProps} 
        connectionStatus={ConnectionStatus.CONNECTED} 
        gameState={gameState} 
      />);
      
      expect(screen.getByTestId("game-view")).toBeInTheDocument();
      expect(screen.queryByTestId("game-lobby")).not.toBeInTheDocument();
    });

    it("shows game view when game has ended (for winner screen)", () => {
      const gameState = createTestGameState({ gameStarted: false, gameEnded: true });
      
      render(<GameLayout {...mockProps} 
        connectionStatus={ConnectionStatus.CONNECTED} 
        gameState={gameState} 
      />);
      
      expect(screen.getByTestId("game-view")).toBeInTheDocument();
      expect(screen.queryByTestId("game-lobby")).not.toBeInTheDocument();
    });
  });

  describe("GameLobby Integration", () => {
    it("passes correct props to GameLobby", () => {
      const gameState = createTestGameState({ gameStarted: false, gameEnded: false });
      
      render(<GameLayout {...mockProps} 
        connectionStatus={ConnectionStatus.CONNECTED} 
        gameState={gameState} 
        currentPlayerId="player1"
      />);
      
      const lobby = screen.getByTestId("game-lobby");
      expect(lobby).toHaveTextContent("Player: player1");
      expect(lobby).toHaveTextContent("Game Started: false");
    });

    it("calls onPlayerReady when ready button clicked in lobby", () => {
      const gameState = createTestGameState({ gameStarted: false, gameEnded: false });
      
      render(<GameLayout {...mockProps} 
        connectionStatus={ConnectionStatus.CONNECTED} 
        gameState={gameState} 
      />);
      
      const readyButton = screen.getByRole("button", { name: "Ready" });
      fireEvent.click(readyButton);
      
      expect(mockProps.onPlayerReady).toHaveBeenCalledWith(true);
    });

    it("calls onStartGame when start game button clicked in lobby", () => {
      const gameState = createTestGameState({ gameStarted: false, gameEnded: false });
      
      render(<GameLayout {...mockProps} 
        connectionStatus={ConnectionStatus.CONNECTED} 
        gameState={gameState} 
      />);
      
      const startButton = screen.getByRole("button", { name: "Start Game" });
      fireEvent.click(startButton);
      
      expect(mockProps.onStartGame).toHaveBeenCalledTimes(1);
    });

    it("calls onSetTopic when topic is set in lobby", () => {
      const gameState = createTestGameState({ gameStarted: false, gameEnded: false });
      
      render(<GameLayout {...mockProps} 
        connectionStatus={ConnectionStatus.CONNECTED} 
        gameState={gameState} 
      />);
      
      const topicButton = screen.getByRole("button", { name: "Set Topic" });
      fireEvent.click(topicButton);
      
      expect(mockProps.onSetTopic).toHaveBeenCalledWith("Test Topic");
    });

    it("calls onSetDifficulty when difficulty is set in lobby", () => {
      const gameState = createTestGameState({ gameStarted: false, gameEnded: false });
      
      render(<GameLayout {...mockProps} 
        connectionStatus={ConnectionStatus.CONNECTED} 
        gameState={gameState} 
      />);
      
      const difficultyButton = screen.getByRole("button", { name: "Set Difficulty" });
      fireEvent.click(difficultyButton);
      
      expect(mockProps.onSetDifficulty).toHaveBeenCalledWith(5);
    });
  });

  describe("GameView Integration", () => {
    it("passes correct props to GameView", () => {
      const gameState = createTestGameState({ gameStarted: true, currentRound: 3 });
      
      render(<GameLayout {...mockProps} 
        connectionStatus={ConnectionStatus.CONNECTED} 
        gameState={gameState} 
        currentPlayerId="player1"
      />);
      
      const gameView = screen.getByTestId("game-view");
      expect(gameView).toHaveTextContent("Player: player1");
      expect(gameView).toHaveTextContent("Round: 3");
    });

    it("calls onSubmitGuess when guess is submitted in game view", () => {
      const gameState = createTestGameState({ gameStarted: true });
      
      render(<GameLayout {...mockProps} 
        connectionStatus={ConnectionStatus.CONNECTED} 
        gameState={gameState} 
      />);
      
      const guessButton = screen.getByRole("button", { name: "Submit Guess" });
      fireEvent.click(guessButton);
      
      expect(mockProps.onSubmitGuess).toHaveBeenCalledWith("test guess");
    });

    it("calls onJoinNextGame when join next game button clicked", () => {
      const gameState = createTestGameState({ gameStarted: true });
      
      render(<GameLayout {...mockProps} 
        connectionStatus={ConnectionStatus.CONNECTED} 
        gameState={gameState} 
      />);
      
      const nextGameButton = screen.getByRole("button", { name: "Join Next Game" });
      fireEvent.click(nextGameButton);
      
      expect(mockProps.onJoinNextGame).toHaveBeenCalledTimes(1);
    });

    it("calls onSendChatMessage when message is sent in game view", () => {
      const gameState = createTestGameState({ gameStarted: true });
      
      render(<GameLayout {...mockProps} 
        connectionStatus={ConnectionStatus.CONNECTED} 
        gameState={gameState} 
      />);
      
      const chatButton = screen.getByRole("button", { name: "Send Message" });
      fireEvent.click(chatButton);
      
      expect(mockProps.onSendChatMessage).toHaveBeenCalledWith("test message");
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
      const gameState = createTestGameState({ gameStarted: false });
      
      render(<GameLayout {...mockProps} 
        connectionStatus={ConnectionStatus.CONNECTED} 
        gameState={gameState} 
        currentPlayerId=""
      />);
      
      expect(screen.getByTestId("game-lobby")).toBeInTheDocument();
    });

    it("prioritizes gameEnded over gameStarted for rendering game view", () => {
      const gameState = createTestGameState({ gameStarted: false, gameEnded: true });
      
      render(<GameLayout {...mockProps} 
        connectionStatus={ConnectionStatus.CONNECTED} 
        gameState={gameState} 
      />);
      
      // Should show game view for winner screen even if gameStarted is false
      expect(screen.getByTestId("game-view")).toBeInTheDocument();
      expect(screen.queryByTestId("game-lobby")).not.toBeInTheDocument();
    });
  });
}); 