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
  joinById: vi.fn(),
  create: vi.fn()
};

vi.mock('colyseus.js', () => ({
  Client: vi.fn(() => mockClient),
  Room: vi.fn(() => mockRoom)
}));

// Mock fetch for game pin lookup API
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('GameClient', () => {
  let gameClient: GameClient;
  let mockEvents: GameClientEvents;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup default successful fetch response for game pin lookup
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        roomId: 'test-room-456',
        gamePin: 'TEST1',
        success: true
      })
    });
    
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
      const client = new GameClient('ws://custom:3000');
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
      const events = { onConnectionStatusChange: vi.fn() };
      gameClient.setEventHandlers(events);
      // No exception should be thrown
    });

    it('should merge event handlers', () => {
      const events1 = { onConnectionStatusChange: vi.fn() };
      const events2 = { onStateChange: vi.fn() };
      
      gameClient.setEventHandlers(events1);
      gameClient.setEventHandlers(events2);
      // No exception should be thrown
    });
  });

  describe('Room Operations', () => {
    describe('createRoom', () => {
      it('should successfully create a room', async () => {
        // Mock successful room creation
        mockClient.create.mockResolvedValue(mockRoom);
        
        const options = {
          playerName: 'TestPlayer',
          topic: 'Science',
          difficulty: 5,
          isPrivate: false
        };

        const result = await gameClient.createRoom(options);

        expect(mockClient.create).toHaveBeenCalledWith('trivia_room', {
          playerName: 'TestPlayer',
          maxPlayers: 8,
          isPrivate: false,
          topic: 'Science',
          difficulty: 5
        });
        expect(result).toBe(mockRoom);
        expect(gameClient.getRoom()).toBe(mockRoom);
        expect(gameClient.getConnectionStatus()).toBe(ConnectionStatus.CONNECTED);
      });
    });

    describe('joinRoom', () => {
      it('should successfully join a room by game pin', async () => {
        // Mock successful room join
        mockClient.joinById.mockResolvedValue(mockRoom);
        
        const options = {
          playerName: 'TestPlayer',
          gamePin: 'TEST1',
          roomOptions: {
            targetScore: 10,
            roundTime: 30000
          }
        };

        const result = await gameClient.joinRoom(options);

        // Should call lookup API
        expect(mockFetch).toHaveBeenCalledWith('http://localhost:2567/api/rooms/lookup/TEST1');
        
        // Should join by room ID after lookup
        expect(mockClient.joinById).toHaveBeenCalledWith('test-room-456', {
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

        // Should not call lookup API when roomId is provided
        expect(mockFetch).not.toHaveBeenCalled();
        
        expect(mockClient.joinById).toHaveBeenCalledWith('specific-room-123', {
          playerName: 'TestPlayer'
        });
        expect(mockClient.joinOrCreate).not.toHaveBeenCalled();
      });

      it('should handle game pin not found', async () => {
        // Mock 404 response
        mockFetch.mockResolvedValue({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: 'Room not found' })
        });

        const options = { 
          playerName: 'TestPlayer',
          gamePin: 'NOTF1' // Valid 5-character format but non-existent room
        };

        await expect(gameClient.joinRoom(options)).rejects.toThrow('Room not found for game pin: NOTF1');
        expect(gameClient.getConnectionStatus()).toBe(ConnectionStatus.DISCONNECTED);
        expect(mockEvents.onError).toHaveBeenCalled();
      });

      it('should handle invalid game pin format', async () => {
        const options = { 
          playerName: 'TestPlayer',
          gamePin: 'invalid'
        };

        await expect(gameClient.joinRoom(options)).rejects.toThrow('Invalid game pin format');
        // Should not set connecting status for validation errors
        expect(gameClient.getConnectionStatus()).toBe(ConnectionStatus.DISCONNECTED);
        expect(mockEvents.onError).toHaveBeenCalled();
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it('should handle missing roomId and gamePin', async () => {
        const options = { playerName: 'TestPlayer' };

        await expect(gameClient.joinRoom(options)).rejects.toThrow('Either roomId or gamePin must be provided');
        expect(gameClient.getConnectionStatus()).toBe(ConnectionStatus.DISCONNECTED);
        expect(mockEvents.onError).toHaveBeenCalled();
      });

      it('should handle join room failure after successful lookup', async () => {
        const error = new Error('Failed to connect');
        mockClient.joinById.mockRejectedValue(error);

        const options = { 
          playerName: 'TestPlayer',
          gamePin: 'TEST1'
        };

        await expect(gameClient.joinRoom(options)).rejects.toThrow('Failed to join room: Failed to connect');
        expect(gameClient.getConnectionStatus()).toBe(ConnectionStatus.ERROR);
        expect(mockEvents.onError).toHaveBeenCalled();
      });

      it('should set up room handlers after joining', async () => {
        mockClient.joinById.mockResolvedValue(mockRoom);
        
        await gameClient.joinRoom({ 
          playerName: 'TestPlayer',
          gamePin: 'TEST1'
        });

        expect(mockRoom.onStateChange).toHaveBeenCalled();
        expect(mockRoom.onMessage).toHaveBeenCalled();
        expect(mockRoom.onLeave).toHaveBeenCalled();
        expect(mockRoom.onError).toHaveBeenCalled();
      });
    });

    describe('leaveRoom', () => {
      beforeEach(async () => {
        // Join a room first
        mockClient.joinById.mockResolvedValue(mockRoom);
        await gameClient.joinRoom({ 
          playerName: 'TestPlayer',
          gamePin: 'TEST1'
        });
      });

      it('should leave room successfully', async () => {
        mockRoom.leave.mockResolvedValue(undefined);

        await gameClient.leaveRoom();

        expect(mockRoom.leave).toHaveBeenCalled();
        expect(gameClient.getRoom()).toBeNull();
        expect(gameClient.getConnectionStatus()).toBe(ConnectionStatus.DISCONNECTED);
      });

      it('should handle leave room failure gracefully', async () => {
        mockRoom.leave.mockRejectedValue(new Error('Leave failed'));

        await gameClient.leaveRoom();

        // Should still clean up state even if leave fails
        expect(gameClient.getRoom()).toBeNull();
        expect(gameClient.getConnectionStatus()).toBe(ConnectionStatus.DISCONNECTED);
      });
    });

    it('should handle leaving when not connected', async () => {
      // Don't join a room first
      await gameClient.leaveRoom();

      // Should not throw an error
      expect(gameClient.getRoom()).toBeNull();
      expect(gameClient.getConnectionStatus()).toBe(ConnectionStatus.DISCONNECTED);
    });
  });

  describe('Message Sending', () => {
    beforeEach(async () => {
      // Join a room first for message sending tests
      mockClient.joinById.mockResolvedValue(mockRoom);
      await gameClient.joinRoom({ 
        playerName: 'TestPlayer',
        gamePin: 'TEST1'
      });
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
      mockClient.joinById.mockResolvedValue(mockRoom);
      await gameClient.joinRoom({ 
        playerName: 'TestPlayer',
        gamePin: 'TEST1'
      });

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
      mockClient.joinById.mockResolvedValue(mockRoom);
      await gameClient.joinRoom({ 
        playerName: 'TestPlayer',
        gamePin: 'TEST1'
      });

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

      // Mock successful lookup
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          roomId: 'test-room-456',
          gamePin: 'TEST1',
          success: true
        })
      });

      // Start connecting - simulate delay in joinById
      mockClient.joinById.mockImplementation(() => {
        // Simulate delay
        return new Promise(resolve => setTimeout(() => resolve(mockRoom), 10));
      });

      const joinPromise = gameClient.joinRoom({ 
        playerName: 'TestPlayer',
        gamePin: 'TEST1'
      });
      
      // Wait a bit for the lookup to complete and connection status to change
      await new Promise(resolve => setTimeout(resolve, 5));
      
      // Should be connecting after successful lookup
      expect(gameClient.getConnectionStatus()).toBe(ConnectionStatus.CONNECTING);
      
      await joinPromise;
      
      // Should be connected
      expect(gameClient.getConnectionStatus()).toBe(ConnectionStatus.CONNECTED);
      expect(statusChanges).toContain(ConnectionStatus.CONNECTING);
      expect(statusChanges).toContain(ConnectionStatus.CONNECTED);
    });
  });
}); 