import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WinnerScreen } from "../../app/components/WinnerScreen";
import { PlayerData } from "@shared/index";

describe("WinnerScreen", () => {
  // Helper function to create a test player
  const createPlayer = (overrides: Partial<PlayerData> = {}): PlayerData => {
    return {
      id: "player1",
      name: "TestWinner",
      score: 25,
      ready: true,
      isHost: false,
      joinedAt: Date.now(),
      ...overrides
    };
  };

  // Helper to create default props for WinnerScreen
  const createDefaultProps = (overrides: Partial<{
    winner: PlayerData;
    restartCountdown: number;
    participatingPlayers: Map<string, boolean>;
    allPlayers: Map<string, PlayerData>;
    currentPlayerId: string;
    onJoinNextGame: () => void;
  }> = {}) => {
    const winner = createPlayer();
    const participatingPlayers = new Map<string, boolean>();
    const allPlayers = new Map<string, PlayerData>();
    allPlayers.set("player1", winner);
    
    return {
      winner,
      restartCountdown: 15,
      participatingPlayers,
      allPlayers,
      currentPlayerId: "player1",
      onJoinNextGame: () => {},
      ...overrides
    };
  };

  it("renders the winner's name prominently", () => {
    const props = createDefaultProps({ winner: createPlayer({ name: "Alice" }) });
    render(<WinnerScreen {...props} />);
    
    const winnerTitle = screen.getByRole("heading", { level: 1 });
    expect(winnerTitle).toHaveTextContent("Alice");
    expect(winnerTitle).toHaveClass("text-3xl", "font-bold", "text-gray-900");
  });

  it("displays 'won the game!' message", () => {
    const props = createDefaultProps();
    render(<WinnerScreen {...props} />);
    
    expect(screen.getByText("won the game!")).toBeInTheDocument();
    expect(screen.getByText("won the game!")).toHaveClass("text-xl", "font-medium", "text-gray-700");
  });

  it("shows the final score", () => {
    const props = createDefaultProps({ winner: createPlayer({ score: 42 }) });
    render(<WinnerScreen {...props} />);
    
    expect(screen.getByText("Final Score")).toBeInTheDocument();
    expect(screen.getByText("42 points")).toBeInTheDocument();
  });

  it("displays trophy emoji in gold medal", () => {
    const props = createDefaultProps();
    render(<WinnerScreen {...props} />);
    
    expect(screen.getByText("🏆")).toBeInTheDocument();
  });

  it("generates avatar with first letter of winner's name", () => {
    const props = createDefaultProps({ winner: createPlayer({ name: "Bob" }) });
    render(<WinnerScreen {...props} />);
    
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("creates container overlay with correct styling", () => {
    const props = createDefaultProps();
    render(<WinnerScreen {...props} />);
    
    const overlay = screen.getByText("won the game!").closest('div[class*="absolute -inset-6"]');
    expect(overlay).toHaveClass("absolute", "-inset-6", "z-50");
    expect(overlay).toHaveClass("bg-white");
  });

  it("handles different name lengths for avatar color generation", () => {
    const shortNameProps = createDefaultProps({ winner: createPlayer({ name: "A" }) });
    const longNameProps = createDefaultProps({ winner: createPlayer({ name: "VeryLongPlayerName" }) });
    
    // First render - test short name
    const { unmount: unmount1 } = render(<WinnerScreen {...shortNameProps} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("A");
    // Verify avatar and gold medal are present
    expect(screen.getByText("🏆")).toBeInTheDocument();
    unmount1();
    
    // Second render - test long name
    render(<WinnerScreen {...longNameProps} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("VeryLongPlayerName");
    // Verify avatar and gold medal are still present with different name
    expect(screen.getByText("🏆")).toBeInTheDocument();
  });

  it("includes celebration elements", () => {
    const props = createDefaultProps();
    render(<WinnerScreen {...props} />);
    
    // Check for sparkle emojis in floating particles
    expect(screen.getAllByText("✨")).toHaveLength(3); // Three ✨ in floating particles
    expect(screen.getAllByText("⭐")).toHaveLength(2); // Two ⭐ emojis in floating particles
  });

  it("renders score with proper formatting", () => {
    const props1 = createDefaultProps({ winner: createPlayer({ score: 0 }) });
    render(<WinnerScreen {...props1} />);
    
    expect(screen.getByText("0 points")).toBeInTheDocument();
    
    // Test with different score
    const props2 = createDefaultProps({ winner: createPlayer({ score: 100 }) });
    render(<WinnerScreen {...props2} />);
    
    expect(screen.getByText("100 points")).toBeInTheDocument();
  });

  it("maintains proper z-index layering", () => {
    const props = createDefaultProps();
    render(<WinnerScreen {...props} />);
    
    // Main overlay should have z-50
    const mainOverlay = screen.getByText("won the game!").closest('div[class*="absolute -inset-6"]');
    expect(mainOverlay).toHaveClass("z-50");
    
    // Content should have relative z-10
    const content = screen.getByText("won the game!").closest('div[class*="relative z-10"]');
    expect(content).toHaveClass("relative", "z-10");
  });
}); 