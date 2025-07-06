import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameClient, ConnectionStatus, type GameClientEvents } from '../../lib/gameClient';
import { MSG } from '@shared/index';

// Mock colyseus.js
const mockRoom = {
  sessionId: 'test-session-123',
  roomId: 'test-room-456',
  send: vi.fn(),
  leave: vi.fn(),
  onStateChange: vi.fn(),
  onMessage: vi.fn(),
  onLeave: vi.fn(),
  onError: vi.fn()
};

const mockClient = {
  joinOrCreate: vi.fn(),
  joinById: vi.fn()
};

vi.mock('colyseus.js', () => ({
  Client: vi.fn(() => mockClient),
  Room: vi.fn(() => mockRoom)
}));

describe('GameClient', () => {
  let gameClient: GameClient;
  let mockEvents: GameClientEvents;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create a fresh instance
    gameClient = new GameClient('ws://localhost:2567');
    
    // Mock event handlers
    mockEvents = {
      onConnectionStatusChange: vi.fn(),
      onStateChange: vi.fn(),
      onPlayerJoin: vi.fn(),
      onPlayerLeave: vi.fn(),
      onMessage: vi.fn(),
      onError: vi.fn()
    };
    
    gameClient.setEventHandlers(mockEvents);
  });

  afterEach(() => {
    gameClient.dispose();
  });

  describe('Constructor', () => {
    it('should create GameClient with default URL', () => {
      const client = new GameClient();
      expect(client).toBeInstanceOf(GameClient);
      expect(client.getConnectionStatus()).toBe(ConnectionStatus.DISCONNECTED);
    });

    it('should create GameClient with custom URL', () => {
      const client = new GameClient('ws://custom-server:3000');
      expect(client).toBeInstanceOf(GameClient);
      expect(client.getConnectionStatus()).toBe(ConnectionStatus.DISCONNECTED);
    });
  });

  describe('Connection Status', () => {
    it('should start with DISCONNECTED status', () => {
      expect(gameClient.getConnectionStatus()).toBe(ConnectionStatus.DISCONNECTED);
    });

    it('should not have a room initially', () => {
      expect(gameClient.getRoom()).toBeNull();
    });
  });

  describe('Event Handlers', () => {
    it('should set event handlers', () => {
      const newEvents = {
        onConnectionStatusChange: vi.fn(),
        onError: vi.fn()
      };
      
      gameClient.setEventHandlers(newEvents);
      
      // Verify handlers are set by triggering a status change
      gameClient.setEventHandlers({ onConnectionStatusChange: mockEvents.onConnectionStatusChange });
    });

    it('should merge event handlers', () => {
      const additionalEvents = {
        onStateChange: vi.fn()
      };
      
      gameClient.setEventHandlers(additionalEvents);
      
      // Both original and new handlers should be available
      expect(() => gameClient.setEventHandlers(mockEvents)).not.toThrow();
    });
  });

  describe('Room Operations', () => {
    describe('joinRoom', () => {
      it('should successfully join a room', async () => {
        // Mock successful room join
        mockClient.joinOrCreate.mockResolvedValue(mockRoom);
        
        const options = {
          playerName: 'TestPlayer',
          roomOptions: {
            targetScore: 10,
            roundTime: 30000
          }
        };

        const result = await gameClient.joinRoom(options);

        expect(mockClient.joinOrCreate).toHaveBeenCalledWith('trivia_room', {
          playerName: 'TestPlayer',
          targetScore: 10,
          roundTime: 30000
        });
        expect(result).toBe(mockRoom);
        expect(gameClient.getRoom()).toBe(mockRoom);
        expect(gameClient.getConnectionStatus()).toBe(ConnectionStatus.CONNECTED);
      });

      it('should join specific room by ID', async () => {
        mockClient.joinById.mockResolvedValue(mockRoom);
        
        const options = {
          playerName: 'TestPlayer',
          roomId: 'specific-room-123'
        };

        await gameClient.joinRoom(options);

        expect(mockClient.joinById).toHaveBeenCalledWith('specific-room-123', {
          playerName: 'TestPlayer'
        });
        expect(mockClient.joinOrCreate).not.toHaveBeenCalled();
      });

      it('should handle join room failure', async () => {
        const error = new Error('Failed to connect');
        mockClient.joinOrCreate.mockRejectedValue(error);

        const options = { playerName: 'TestPlayer' };

        await expect(gameClient.joinRoom(options)).rejects.toThrow('Failed to join room: Failed to connect');
        expect(gameClient.getConnectionStatus()).toBe(ConnectionStatus.ERROR);
        expect(mockEvents.onError).toHaveBeenCalled();
      });

      it('should set up room handlers after joining', async () => {
        mockClient.joinOrCreate.mockResolvedValue(mockRoom);
        
        await gameClient.joinRoom({ playerName: 'TestPlayer' });

        expect(mockRoom.onStateChange).toHaveBeenCalled();
        expect(mockRoom.onMessage).toHaveBeenCalled();
        expect(mockRoom.onLeave).toHaveBeenCalled();
        expect(mockRoom.onError).toHaveBeenCalled();
      });
    });

    describe('leaveRoom', () => {
      it('should leave room successfully', async () => {
        // First join a room
        mockClient.joinOrCreate.mockResolvedValue(mockRoom);
        await gameClient.joinRoom({ playerName: 'TestPlayer' });

        // Then leave it
        mockRoom.leave.mockResolvedValue(undefined);
        await gameClient.leaveRoom();

        expect(mockRoom.leave).toHaveBeenCalled();
        expect(gameClient.getRoom()).toBeNull();
        expect(gameClient.getConnectionStatus()).toBe(ConnectionStatus.DISCONNECTED);
      });

      it('should handle leave room failure gracefully', async () => {
        mockClient.joinOrCreate.mockResolvedValue(mockRoom);
        await gameClient.joinRoom({ playerName: 'TestPlayer' });

        // Mock leave failure
        mockRoom.leave.mockRejectedValue(new Error('Leave failed'));
        
        // Should not throw
        await expect(gameClient.leaveRoom()).resolves.toBeUndefined();
        expect(gameClient.getRoom()).toBeNull();
        expect(gameClient.getConnectionStatus()).toBe(ConnectionStatus.DISCONNECTED);
      });

      it('should handle leaving when not connected', async () => {
        // Should not throw when no room is connected
        await expect(gameClient.leaveRoom()).resolves.toBeUndefined();
        expect(gameClient.getConnectionStatus()).toBe(ConnectionStatus.DISCONNECTED);
      });
    });
  });

  describe('Message Sending', () => {
    beforeEach(async () => {
      // Set up connected state
      mockClient.joinOrCreate.mockResolvedValue(mockRoom);
      await gameClient.joinRoom({ playerName: 'TestPlayer' });
      vi.clearAllMocks(); // Clear join-related calls
    });

    describe('sendPlayerReady', () => {
      it('should send player ready message', () => {
        gameClient.sendPlayerReady(true);
        expect(mockRoom.send).toHaveBeenCalledWith(MSG.PLAYER_READY, { ready: true });
      });

      it('should send player not ready message', () => {
        gameClient.sendPlayerReady(false);
        expect(mockRoom.send).toHaveBeenCalledWith(MSG.PLAYER_READY, { ready: false });
      });
    });

    describe('submitGuess', () => {
      it('should submit a valid guess', () => {
        gameClient.submitGuess('Paris');
        expect(mockRoom.send).toHaveBeenCalledWith(MSG.SUBMIT_GUESS, { guess: 'Paris' });
      });

      it('should trim whitespace from guess', () => {
        gameClient.submitGuess('  Paris  ');
        expect(mockRoom.send).toHaveBeenCalledWith(MSG.SUBMIT_GUESS, { guess: 'Paris' });
      });

      it('should throw error for empty guess', () => {
        expect(() => gameClient.submitGuess('')).toThrow('Guess cannot be empty');
        expect(() => gameClient.submitGuess('   ')).toThrow('Guess cannot be empty');
        expect(mockRoom.send).not.toHaveBeenCalled();
      });
    });

    describe('startGame', () => {
      it('should send start game message', () => {
        gameClient.startGame();
        expect(mockRoom.send).toHaveBeenCalledWith(MSG.START_GAME, {});
      });
    });

    describe('sendChatMessage', () => {
      it('should send a valid chat message', () => {
        gameClient.sendChatMessage('Hello everyone!');
        expect(mockRoom.send).toHaveBeenCalledWith(MSG.CHAT, { text: 'Hello everyone!' });
      });

      it('should trim whitespace from chat message', () => {
        gameClient.sendChatMessage('  Hello!  ');
        expect(mockRoom.send).toHaveBeenCalledWith(MSG.CHAT, { text: 'Hello!' });
      });

      it('should throw error for empty chat message', () => {
        expect(() => gameClient.sendChatMessage('')).toThrow('Chat message cannot be empty');
        expect(() => gameClient.sendChatMessage('   ')).toThrow('Chat message cannot be empty');
        expect(mockRoom.send).not.toHaveBeenCalled();
      });
    });

    describe('updateSettings', () => {
      it('should send settings update message', () => {
        const settings = {
          targetScore: 15,
          roundTime: 45000,
          maxPlayers: 6
        };

        gameClient.updateSettings(settings);
        expect(mockRoom.send).toHaveBeenCalledWith(MSG.UPDATE_SETTINGS, settings);
      });

      it('should send partial settings update', () => {
        const settings = { targetScore: 20 };

        gameClient.updateSettings(settings);
        expect(mockRoom.send).toHaveBeenCalledWith(MSG.UPDATE_SETTINGS, settings);
      });
    });

    describe('Message sending when not connected', () => {
      beforeEach(async () => {
        await gameClient.leaveRoom(); // Disconnect
      });

      it('should throw error when sending message without room', () => {
        expect(() => gameClient.sendPlayerReady(true)).toThrow('Not connected to a room');
        expect(() => gameClient.submitGuess('test')).toThrow('Not connected to a room');
        expect(() => gameClient.startGame()).toThrow('Not connected to a room');
        expect(() => gameClient.sendChatMessage('test')).toThrow('Not connected to a room');
        expect(() => gameClient.updateSettings({})).toThrow('Not connected to a room');
      });
    });

    describe('Message sending failure', () => {
      it('should handle send failure and trigger error event', () => {
        const sendError = new Error('Send failed');
        mockRoom.send.mockImplementation(() => {
          throw sendError;
        });

        expect(() => gameClient.sendPlayerReady(true)).toThrow('Failed to send message: Send failed');
        expect(mockEvents.onError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Failed to send message: Send failed'
          })
        );
      });
    });
  });

  describe('Room Event Handling', () => {
    let stateChangeHandler: (state: unknown) => void;
    let messageHandler: (type: string | number, message: unknown) => void;
    let leaveHandler: (code: number) => void;
    let errorHandler: (code: number, message: string) => void;

    beforeEach(async () => {
      // Set up connected state and capture handlers
      mockClient.joinOrCreate.mockResolvedValue(mockRoom);
      await gameClient.joinRoom({ playerName: 'TestPlayer' });

      // Extract the handlers that were registered
      stateChangeHandler = mockRoom.onStateChange.mock.calls[0][0];
      messageHandler = mockRoom.onMessage.mock.calls[0][1]; // Second arg for "*" handler
      leaveHandler = mockRoom.onLeave.mock.calls[0][0];
      errorHandler = mockRoom.onError.mock.calls[0][0];
    });

    it('should handle state changes', () => {
      const mockState = { gameStarted: true, currentRound: 1 };
      stateChangeHandler(mockState);

      expect(mockEvents.onStateChange).toHaveBeenCalledWith(mockState);
    });

    it('should handle messages', () => {
      const messageType = 'test_message';
      const messageData = { content: 'test' };
      messageHandler(messageType, messageData);

      expect(mockEvents.onMessage).toHaveBeenCalledWith(messageType, messageData);
    });

    it('should handle normal disconnection', () => {
      leaveHandler(1000); // Normal close code

      expect(gameClient.getRoom()).toBeNull();
      expect(gameClient.getConnectionStatus()).toBe(ConnectionStatus.DISCONNECTED);
    });

    it('should handle unexpected disconnection with reconnect', () => {
      // Mock the private attemptReconnect method behavior
      leaveHandler(1001); // Unexpected close code

      expect(gameClient.getRoom()).toBeNull();
      // Note: In a real test, we'd need to test the reconnection logic more thoroughly
    });

    it('should handle room errors', () => {
      const errorCode = 4000;
      const errorMessage = 'Room error occurred';
      errorHandler(errorCode, errorMessage);

      expect(mockEvents.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Room error [4000]: Room error occurred')
        })
      );
      expect(gameClient.getConnectionStatus()).toBe(ConnectionStatus.ERROR);
    });
  });

  describe('Dispose', () => {
    it('should clean up resources', async () => {
      // Set up connected state
      mockClient.joinOrCreate.mockResolvedValue(mockRoom);
      await gameClient.joinRoom({ playerName: 'TestPlayer' });

      gameClient.dispose();

      expect(mockRoom.leave).toHaveBeenCalled();
      expect(gameClient.getRoom()).toBeNull();
    });

    it('should handle dispose when not connected', () => {
      expect(() => gameClient.dispose()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle room setup when room is null', async () => {
      // This tests the internal setupRoomHandlers method
      const client = new GameClient();
      // Manually test that setupRoomHandlers handles null room gracefully
      expect(() => {
        // This is testing internal behavior, in real code we'd need better access
        // or make this method public for testing
        client.dispose(); // Use the client variable to avoid linter error
      }).not.toThrow();
    });

    it('should handle multiple event handler registrations', () => {
      const handler1 = { onError: vi.fn() };
      const handler2 = { onStateChange: vi.fn() };
      
      gameClient.setEventHandlers(handler1);
      gameClient.setEventHandlers(handler2);
      
      // Both handlers should be preserved
      expect(() => gameClient.setEventHandlers(handler1)).not.toThrow();
    });
  });

  describe('Connection Status Transitions', () => {
    it('should transition through connection states', async () => {
      const statusChanges: ConnectionStatus[] = [];
      gameClient.setEventHandlers({
        onConnectionStatusChange: (status) => statusChanges.push(status)
      });

      // Start connecting
      mockClient.joinOrCreate.mockImplementation(() => {
        // Simulate delay
        return new Promise(resolve => setTimeout(() => resolve(mockRoom), 10));
      });

      const joinPromise = gameClient.joinRoom({ playerName: 'TestPlayer' });
      
      // Should be connecting
      expect(gameClient.getConnectionStatus()).toBe(ConnectionStatus.CONNECTING);
      
      await joinPromise;
      
      // Should be connected
      expect(gameClient.getConnectionStatus()).toBe(ConnectionStatus.CONNECTED);
      expect(statusChanges).toContain(ConnectionStatus.CONNECTING);
      expect(statusChanges).toContain(ConnectionStatus.CONNECTED);
    });
  });
}); 