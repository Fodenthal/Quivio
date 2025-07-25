import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Homepage } from "../../app/components/Homepage";
import { DisplayNameProvider } from "../../contexts/DisplayNameContext";

// Mock the props
const mockOnJoinRoom = vi.fn();
const mockOnCreateRoom = vi.fn();

// Mock the GamePins component
vi.mock("../../app/components/GamePins", () => ({
    GamePins: vi.fn(() => <div data-testid="game-pins">Game Pins Mock</div>)
}));

// Mock the TrendingTopics component
vi.mock("../../app/components/TrendingTopics", () => ({
    TrendingTopics: vi.fn(() => <div data-testid="trending-topics">Trending Topics Mock</div>)
}));

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <DisplayNameProvider>
      {component}
    </DisplayNameProvider>
  );
};

describe("Homepage", () => {
  it("join button is disabled when name is empty", () => {
    renderWithProvider(<Homepage onJoinRoom={mockOnJoinRoom} onCreateRoom={mockOnCreateRoom} />);
    
    const joinButton = screen.getByRole("button", { name: /Join Room/ });

    expect(joinButton).toBeDisabled();
  });

  it("join button is disabled when game pin is empty", () => {
    renderWithProvider(<Homepage onJoinRoom={mockOnJoinRoom} onCreateRoom={mockOnCreateRoom} />);
    
    const joinButton = screen.getByRole("button", { name: /Join Room/ });

    expect(joinButton).toBeDisabled();
  });
});
