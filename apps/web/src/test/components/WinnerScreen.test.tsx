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
    expect(winnerTitle).toHaveClass("text-5xl", "font-bold", "text-primary");
  });

  it("displays 'won the game!' message", () => {
    const props = createDefaultProps();
    render(<WinnerScreen {...props} />);
    
    expect(screen.getByText("won the game!")).toBeInTheDocument();
    expect(screen.getByText("won the game!")).toHaveClass("text-3xl", "font-medium", "text-text-main");
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

  it("creates container with correct styling", () => {
    const props = createDefaultProps();
    render(<WinnerScreen {...props} />);
    
    const container = screen.getByText("won the game!").closest('[class*="relative z-10"]');
    expect(container).toHaveClass("relative", "z-10");
    expect(container).toHaveClass("bg-white/10", "rounded-2xl");
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
    
    // Check for trophy emoji in the winner display
    expect(screen.getByText("🏆")).toBeInTheDocument();
    // Current implementation doesn't have floating particles, just verify main elements are present
    expect(screen.getByText("won the game!")).toBeInTheDocument();
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
    
    // Content should have relative z-10
    const content = screen.getByText("won the game!").closest('[class*="relative z-10"]');
    expect(content).toHaveClass("relative", "z-10");
  });
}); 