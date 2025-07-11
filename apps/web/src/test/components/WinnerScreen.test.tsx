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

  it("renders the winner's name prominently", () => {
    const winner = createPlayer({ name: "Alice" });
    render(<WinnerScreen winner={winner} />);
    
    const winnerTitle = screen.getByRole("heading", { level: 1 });
    expect(winnerTitle).toHaveTextContent("Alice");
    expect(winnerTitle).toHaveClass("text-3xl", "font-bold", "text-gray-900");
  });

  it("displays 'won the game!' message", () => {
    const winner = createPlayer();
    render(<WinnerScreen winner={winner} />);
    
    expect(screen.getByText("won the game!")).toBeInTheDocument();
    expect(screen.getByText("won the game!")).toHaveClass("text-xl", "font-medium", "text-gray-700");
  });

  it("shows the final score", () => {
    const winner = createPlayer({ score: 42 });
    render(<WinnerScreen winner={winner} />);
    
    expect(screen.getByText("Final Score")).toBeInTheDocument();
    expect(screen.getByText("42 points")).toBeInTheDocument();
  });

  it("displays trophy emoji in gold medal", () => {
    const winner = createPlayer();
    render(<WinnerScreen winner={winner} />);
    
    expect(screen.getByText("🏆")).toBeInTheDocument();
  });

  it("generates avatar with first letter of winner's name", () => {
    const winner = createPlayer({ name: "Bob" });
    render(<WinnerScreen winner={winner} />);
    
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("creates container overlay with correct styling", () => {
    const winner = createPlayer();
    render(<WinnerScreen winner={winner} />);
    
    const overlay = screen.getByText("won the game!").closest('div[class*="absolute -inset-6"]');
    expect(overlay).toHaveClass("absolute", "-inset-6", "z-50");
    expect(overlay).toHaveClass("bg-white");
  });

  it("handles different name lengths for avatar color generation", () => {
    const shortName = createPlayer({ name: "A" });
    const longName = createPlayer({ name: "VeryLongPlayerName" });
    
    // First render - test short name
    const { unmount: unmount1 } = render(<WinnerScreen winner={shortName} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("A");
    // Verify avatar and gold medal are present
    expect(screen.getByText("🏆")).toBeInTheDocument();
    unmount1();
    
    // Second render - test long name
    render(<WinnerScreen winner={longName} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("VeryLongPlayerName");
    // Verify avatar and gold medal are still present with different name
    expect(screen.getByText("🏆")).toBeInTheDocument();
  });

  it("includes celebration elements", () => {
    const winner = createPlayer();
    render(<WinnerScreen winner={winner} />);
    
    // Check for celebration emojis (but don't assert specific count due to multiple instances)
    expect(screen.getAllByText("🎉")).toHaveLength(2); // Two 🎉 emojis in celebration section
    expect(screen.getAllByText("✨")).toHaveLength(5); // Multiple ✨ in different sections (2 in celebration + 3 in floating particles)
    expect(screen.getByText("🎊")).toBeInTheDocument(); // One 🎊 emoji
    expect(screen.getAllByText("⭐")).toHaveLength(2); // Two ⭐ emojis in floating particles
  });

  it("renders score with proper formatting", () => {
    const winner = createPlayer({ score: 0 });
    render(<WinnerScreen winner={winner} />);
    
    expect(screen.getByText("0 points")).toBeInTheDocument();
    
    // Test with different score
    const highScoreWinner = createPlayer({ score: 100 });
    render(<WinnerScreen winner={highScoreWinner} />);
    
    expect(screen.getByText("100 points")).toBeInTheDocument();
  });

  it("maintains proper z-index layering", () => {
    const winner = createPlayer();
    render(<WinnerScreen winner={winner} />);
    
    // Main overlay should have z-50
    const mainOverlay = screen.getByText("won the game!").closest('div[class*="absolute -inset-6"]');
    expect(mainOverlay).toHaveClass("z-50");
    
    // Content should have relative z-10
    const content = screen.getByText("won the game!").closest('div[class*="relative z-10"]');
    expect(content).toHaveClass("relative", "z-10");
  });
}); 