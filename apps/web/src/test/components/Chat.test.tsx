import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Chat } from '@/app/components/Chat';
import { ChatMessage } from '@shared/index';

describe('Chat Component', () => {
  const mockOnSendMessage = vi.fn();
  
  const validMessages: ChatMessage[] = [
    {
      id: '1',
      playerId: 'player1',
      playerName: 'Alice',
      content: 'Hello everyone!',
      timestamp: Date.now(),
      type: 'player'
    },
    {
      id: '2',
      playerId: 'system',
      playerName: 'System',
      content: 'Game started!',
      timestamp: Date.now(),
      type: 'system'
    }
  ];

  beforeEach(() => {
    mockOnSendMessage.mockClear();
  });

  it('renders chat with valid messages', () => {
    render(
      <Chat
        messages={validMessages}
        currentPlayerId="player1"
        onSendMessage={mockOnSendMessage}
        disabled={false}
      />
    );

    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Hello everyone!')).toBeInTheDocument();
    expect(screen.getByText('Game started!')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
  });

  it('handles empty messages array', () => {
    render(
      <Chat
        messages={[]}
        currentPlayerId="player1"
        onSendMessage={mockOnSendMessage}
        disabled={false}
      />
    );

    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('No messages yet')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
  });

  it('filters out invalid messages', () => {
          const messagesWithInvalid = [
        ...validMessages,
        // Invalid messages that should be filtered
        { id: '', playerName: '', content: '', timestamp: 0, type: 'player' as const, playerId: '' },
        { id: '3', playerName: '', content: 'Test', timestamp: Date.now(), type: 'player' as const, playerId: 'player3' },
      ];

    render(
      <Chat
        messages={messagesWithInvalid}
        currentPlayerId="player1"
        onSendMessage={mockOnSendMessage}
        disabled={false}
      />
    );

    // Should only show the 2 valid messages
    expect(screen.getByText('2 messages')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Game started!')).toBeInTheDocument();
  });

  it('sends message when Enter key is pressed', () => {
    render(
      <Chat
        messages={validMessages}
        currentPlayerId="player1"
        onSendMessage={mockOnSendMessage}
        disabled={false}
      />
    );

    const textarea = screen.getByPlaceholderText('Type a message...');

    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

    expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
  });

  it('handles disabled state', () => {
    render(
      <Chat
        messages={validMessages}
        currentPlayerId="player1"
        onSendMessage={mockOnSendMessage}
        disabled={true}
      />
    );

    const textarea = screen.getByPlaceholderText('Chat unavailable...');

    expect(textarea).toBeDisabled();
  });

  it('shows message count in header', () => {
    render(
      <Chat
        messages={validMessages}
        currentPlayerId="player1"
        onSendMessage={mockOnSendMessage}
        disabled={false}
      />
    );

    expect(screen.getByText('2 messages')).toBeInTheDocument();
  });
}); 