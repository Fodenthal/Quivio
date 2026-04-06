import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Homepage } from "../../app/components/Homepage";
import { DisplayNameProvider } from "../../contexts/DisplayNameContext";

// Mock the props
const mockOnJoinRoom = vi.fn();
const mockOnCreateRoom = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("../../app/components/ActiveRoomsList", () => ({
  ActiveRoomsList: () => <div data-testid="active-rooms-list">Active Rooms</div>,
}));

vi.mock("../../app/components/UserDropdown", () => ({
  UserDropdown: () => <div data-testid="user-dropdown">User Dropdown</div>,
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
    
    const joinButtons = screen.getAllByRole("button", { name: /Join Room/ });

    expect(joinButtons).toHaveLength(2);
    joinButtons.forEach((button) => expect(button).toBeDisabled());
  });

  it("join button is disabled when game pin is empty", () => {
    renderWithProvider(<Homepage onJoinRoom={mockOnJoinRoom} onCreateRoom={mockOnCreateRoom} />);
    
    const joinButtons = screen.getAllByRole("button", { name: /Join Room/ });

    expect(joinButtons).toHaveLength(2);
    joinButtons.forEach((button) => expect(button).toBeDisabled());
  });

  it("shows the new learn mode entry point", () => {
    renderWithProvider(<Homepage onJoinRoom={mockOnJoinRoom} onCreateRoom={mockOnCreateRoom} />);

    expect(screen.getByRole("button", { name: /Courses and lessons/i })).toBeInTheDocument();
    expect(screen.getByText(/Learn the classical world, then prove what you know/i)).toBeInTheDocument();
  });
});
