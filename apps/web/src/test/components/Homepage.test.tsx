import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Homepage } from "../../app/components/Homepage";

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

describe("Homepage", () => {
  it("shows alert for empty name submission", () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<Homepage onJoinRoom={mockOnJoinRoom} onCreateRoom={mockOnCreateRoom} />);
    
    const gamePinInput = screen.getByPlaceholderText("ABCD123");
    const joinButton = screen.getByRole("button", { name: /Join Room/ });

    fireEvent.change(gamePinInput, { target: { value: "12345" } });
    fireEvent.click(joinButton);

    expect(alertSpy).toHaveBeenCalledWith("Please enter your name and a game pin");
    alertSpy.mockRestore();
  });

  it("shows alert for empty game pin submission", () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<Homepage onJoinRoom={mockOnJoinRoom} onCreateRoom={mockOnCreateRoom} />);
    
    const nameInput = screen.getByPlaceholderText("Your name");
    const joinButton = screen.getByRole("button", { name: /Join Room/ });

    fireEvent.change(nameInput, { target: { value: "TestPlayer" } });
    fireEvent.click(joinButton);

    expect(alertSpy).toHaveBeenCalledWith("Please enter your name and a game pin");
    alertSpy.mockRestore();
  });
});
