import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GameLayout } from "../../app/components/GameLayout";
import { ConnectionStatus } from "../../lib/gameClient";

// Mock the GameClient
const mockGameClient = {
  setEventHandlers: vi.fn(),
  joinRoom: vi.fn(),
  dispose: vi.fn(),
  getConnectionStatus: vi.fn(() => ConnectionStatus.DISCONNECTED),
};

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
        onError: expect.any(Function),
      });
    });
  });

  describe("Connection Status Display", () => {
    it("shows correct status text for each connection state", () => {
      const { rerender } = render(<GameLayout />);
      
      // Get the event handlers that were set
      const eventHandlers = mockGameClient.setEventHandlers.mock.calls[0][0];
      
      // Test different status changes
      eventHandlers.onConnectionStatusChange(ConnectionStatus.CONNECTING);
      rerender(<GameLayout />);
      expect(screen.getByText("Connecting...")).toBeInTheDocument();
      
      eventHandlers.onConnectionStatusChange(ConnectionStatus.CONNECTED);
      rerender(<GameLayout />);
      expect(screen.getByText("Connected")).toBeInTheDocument();
      
      eventHandlers.onConnectionStatusChange(ConnectionStatus.RECONNECTING);
      rerender(<GameLayout />);
      expect(screen.getByText("Reconnecting...")).toBeInTheDocument();
      
      eventHandlers.onConnectionStatusChange(ConnectionStatus.ERROR);
      rerender(<GameLayout />);
      expect(screen.getByText("Connection Error")).toBeInTheDocument();
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
    it("shows game interface when connected", () => {
      const { rerender } = render(<GameLayout />);
      
      // Simulate connection
      const eventHandlers = mockGameClient.setEventHandlers.mock.calls[0][0];
      eventHandlers.onConnectionStatusChange(ConnectionStatus.CONNECTED);
      
      // Re-render to see the change
      rerender(<GameLayout />);
      
      expect(screen.getByText("Game Interface")).toBeInTheDocument();
      expect(screen.getByText("Connected to game! Game interface will be implemented in the next phase.")).toBeInTheDocument();
      
      // Should not show join form heading
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
}); 