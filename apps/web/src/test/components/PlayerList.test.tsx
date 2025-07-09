import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlayerList } from '@/app/components/PlayerList';
import { GameState, PlayerData } from '@shared/index';

// Helper function to create a mock player
const createMockPlayer = (id: string, name: string, score: number, isHost = false): PlayerData => ({
  id,
  name,
  score,
  ready: true,
  isHost,
  joinedAt: Date.now() - Math.random() * 10000,
});

// Helper function to create a mock game state
const createMockGameState = (players: PlayerData[]): GameState => {
  const playersMap = new Map<string, PlayerData>();
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
    chatMessages: new Map(),
  };
};

describe('PlayerList', () => {
  test('should display players ordered by score (high to low)', () => {
    const players = [
      createMockPlayer('player1', 'Alice', 30),
      createMockPlayer('player2', 'Bob', 50), // Highest score
      createMockPlayer('player3', 'Charlie', 20),
    ];
    
    const gameState = createMockGameState(players);
    
    render(<PlayerList gameState={gameState} currentPlayerId="player1" />);
    
    // Verify all players are displayed
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    
    // Verify scores are displayed
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    
    // Get all player cards
    const playerCards = screen.getAllByText(/Alice|Bob|Charlie/).map(el => 
      el.closest('[class*="p-4"]')
    );
    
    // Verify Bob (highest score) is first
    expect(playerCards[0]).toHaveTextContent('Bob');
    expect(playerCards[0]).toHaveTextContent('50');
  });

  test('should highlight current player', () => {
    const players = [
      createMockPlayer('player1', 'Alice', 30),
      createMockPlayer('player2', 'Bob', 50),
    ];
    
    const gameState = createMockGameState(players);
    
    render(<PlayerList gameState={gameState} currentPlayerId="player1" />);
    
    // Find Alice's card (current player)
    const aliceCard = screen.getByText('Alice').closest('[class*="p-4"]');
    const bobCard = screen.getByText('Bob').closest('[class*="p-4"]');
    
    // Alice should have current player styling
    expect(aliceCard).toHaveClass('bg-blue-50', 'border-blue-300');
    expect(screen.getByText('You')).toBeInTheDocument();
    
    // Bob should have normal styling
    expect(bobCard).toHaveClass('bg-white', 'border-gray-200');
  });

  test('should show leader crown for highest scoring player', () => {
    const players = [
      createMockPlayer('player1', 'Alice', 30),
      createMockPlayer('player2', 'Bob', 50), // Leader
      createMockPlayer('player3', 'Charlie', 0),
    ];
    
    const gameState = createMockGameState(players);
    
    render(<PlayerList gameState={gameState} currentPlayerId="player1" />);
    
    // Bob should have the crown emoji since he has the highest score
    const bobCard = screen.getByText('Bob').closest('[class*="relative"]');
    expect(bobCard).toHaveTextContent('👑');
    
    // Others should not have crown
    const aliceCard = screen.getByText('Alice').closest('[class*="relative"]');
    const charlieCard = screen.getByText('Charlie').closest('[class*="relative"]');
    expect(aliceCard).not.toHaveTextContent('👑');
    expect(charlieCard).not.toHaveTextContent('👑');
  });

  test('should show host badge', () => {
    const players = [
      createMockPlayer('player1', 'Alice', 30, true), // Host
      createMockPlayer('player2', 'Bob', 50),
    ];
    
    const gameState = createMockGameState(players);
    
    render(<PlayerList gameState={gameState} currentPlayerId="player2" />);
    
    // Alice should have host badge
    expect(screen.getByText('Host')).toBeInTheDocument();
    
    // Verify host badge is near Alice's name
    const aliceCard = screen.getByText('Alice').closest('[class*="p-4"]');
    expect(aliceCard).toHaveTextContent('Host');
  });

  test('should display player count correctly', () => {
    const players = [
      createMockPlayer('player1', 'Alice', 30),
      createMockPlayer('player2', 'Bob', 50),
    ];
    
    const gameState = createMockGameState(players);
    
    render(<PlayerList gameState={gameState} currentPlayerId="player1" />);
    
    // Should show "Players (2/8)" since maxPlayers is 8
    expect(screen.getByText('Players (2/8)')).toBeInTheDocument();
  });
}); 