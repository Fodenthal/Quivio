import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlayerList } from "../../app/components/PlayerList";
import { GameState, PlayerData } from "@shared/index";

describe("PlayerList", () => {
  const createPlayer = (overrides: Partial<PlayerData> = {}): PlayerData => ({
    id: "player1",
    name: "TestPlayer",
    score: 5,
    ready: true,
    isHost: false,
    joinedAt: Date.now(),
    ...overrides
  });

  const createGameState = (players: PlayerData[] = [], overrides: Partial<GameState> = {}): GameState => {
    const playersMap = new Map();
    players.forEach(player => playersMap.set(player.id, player));

  return {
    targetScore: 100,
    roundTime: 30000,
    maxPlayers: 8,
    isPrivate: false,
    gameStarted: true,
    gameEnded: false,
    gamePaused: false,
    canStart: false,
    currentRound: 1,
    hostId: players[0]?.id || "",
    winnerId: "",
    roundStartTime: Date.now(),
    roundTimeRemaining: 25000,
    roundEnded: false,
    correctAnswer: "",
    players: playersMap,
    currentPrompt: {
      id: "test-prompt",
      text: "Test prompt",
      category: "test",
      difficulty: "easy" as const,
      answer: "test answer"
    },
    roundGuesses: new Map(),
    playerIncorrectGuesses: new Map(),
    chatMessages: new Map(),
    ...overrides
  };
  };

  it("renders with basic player information", () => {
    const player = createPlayer();
    const gameState = createGameState([player]);

    render(<PlayerList gameState={gameState} />);

    expect(screen.getByText("Players (1/8)")).toBeInTheDocument();
    expect(screen.getByText("TestPlayer")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("points")).toBeInTheDocument();
  });

  it("sorts players by score in descending order", () => {
    const players = [
      createPlayer({ id: "player1", name: "Low", score: 5 }),
      createPlayer({ id: "player2", name: "High", score: 15 }),
      createPlayer({ id: "player3", name: "Mid", score: 10 })
    ];
    const gameState = createGameState(players);

    render(<PlayerList gameState={gameState} />);

    const playerNames = screen.getAllByText(/High|Mid|Low/);
    expect(playerNames[0]).toHaveTextContent("High");
    expect(playerNames[1]).toHaveTextContent("Mid");
    expect(playerNames[2]).toHaveTextContent("Low");
  });

  it("highlights players who guessed correctly", () => {
    const player = createPlayer();
    const gameState = createGameState([player]);
    
    // Set up a correct guess for the player
    gameState.roundGuesses.set(player.id, {
      playerId: player.id,
      guess: "correct answer",
      timestamp: Date.now(),
      isCorrect: true
    });

    render(<PlayerList gameState={gameState} />);

    expect(screen.getByText("✓ Correct")).toBeInTheDocument();
    
    // Check for correct highlighting (find the player card with purple gradient background)
    const playerCard = screen.getByText("TestPlayer").closest('[class*="bg-gradient-to-r"]');
    expect(playerCard).toHaveClass("bg-gradient-to-r", "from-purple-100", "to-purple-50");
  });

  it("shows host badge for host player", () => {
    const player = createPlayer({ isHost: true });
    const gameState = createGameState([player], { hostId: player.id });

    render(<PlayerList gameState={gameState} />);

    expect(screen.getByText("Host")).toBeInTheDocument();
  });

  it("generates proper avatars with first letter", () => {
    const player = createPlayer({ name: "Alice" });
    const gameState = createGameState([player]);

    render(<PlayerList gameState={gameState} />);

    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("displays incorrect guesses for players", () => {
    const player = createPlayer();
    const gameState = createGameState([player]);
    
    // Set up an incorrect guess for the player
    gameState.playerIncorrectGuesses.set(player.id, {
      playerId: player.id,
      guess: "wrong answer",
      timestamp: Date.now()
    });

    render(<PlayerList gameState={gameState} />);

    // Check that the incorrect guess text is displayed
    expect(screen.getByText(/wrong answer/)).toBeInTheDocument();
    // Verify the content includes quotes (any kind) to confirm it's styled as a guess
    const guessingElement = screen.getByText(/wrong answer/).closest('span');
    expect(guessingElement?.textContent).toContain('wrong answer');
    expect(guessingElement?.textContent?.length).toBeGreaterThan('wrong answer'.length); // Should have quotes around it
  });

  it("shows empty space when no incorrect guess exists", () => {
    const player = createPlayer();
    const gameState = createGameState([player]);
    // No incorrect guess set

    render(<PlayerList gameState={gameState} />);

    // Should not show any quoted text for incorrect guesses
    expect(screen.queryByText(/"/)).not.toBeInTheDocument();
  });

  it("handles multiple players with different guess states", () => {
    const players = [
      createPlayer({ id: "player1", name: "Alice", score: 10 }),
      createPlayer({ id: "player2", name: "Bob", score: 15 }),
      createPlayer({ id: "player3", name: "Charlie", score: 5 })
    ];
    const gameState = createGameState(players);
    
    // Alice has correct guess
    gameState.roundGuesses.set("player1", {
      playerId: "player1",
      guess: "correct",
      timestamp: Date.now(),
      isCorrect: true
    });
    
    // Bob has incorrect guess
    gameState.playerIncorrectGuesses.set("player2", {
      playerId: "player2",
      guess: "bob's wrong answer",
      timestamp: Date.now()
    });
    
    // Charlie has no guess

    render(<PlayerList gameState={gameState} />);

    // Check sorting (Bob should be first with 15 points)
    const playerNames = screen.getAllByText(/Alice|Bob|Charlie/);
    expect(playerNames[0]).toHaveTextContent("Bob");
    expect(playerNames[1]).toHaveTextContent("Alice");
    expect(playerNames[2]).toHaveTextContent("Charlie");

    // Check Alice has correct badge
    expect(screen.getByText("✓ Correct")).toBeInTheDocument();
    
    // Check Bob has incorrect guess displayed
    expect(screen.getByText(/bob's wrong answer/)).toBeInTheDocument();
    // Verify the content includes quotes (any kind) to confirm it's styled as a guess
    const bobGuessElement = screen.getByText(/bob's wrong answer/).closest('span');
    expect(bobGuessElement?.textContent).toContain("bob's wrong answer");
    expect(bobGuessElement?.textContent?.length).toBeGreaterThan("bob's wrong answer".length); // Should have quotes around it
    
    // Charlie should have no guess display (no quotes in his player card)
    const charlieCard = screen.getByText("Charlie").closest('[class*="p-4"]');
    expect(charlieCard?.textContent).not.toMatch(/"/); // No quotes should be present
  });

  it("handles empty player list gracefully", () => {
    const gameState = createGameState([]);

    render(<PlayerList gameState={gameState} />);

    expect(screen.getByText("Players (0/8)")).toBeInTheDocument();
  });
}); 