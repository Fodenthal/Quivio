import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Chat } from '@/app/components/Chat';
import { ChatMessage as ChatMessageType } from '@shared/index';

describe('Chat Component', () => {
  const mockOnSendMessage = vi.fn();
  
  const validMessages: ChatMessageType[] = [
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

  afterEach(() => {
    vi.clearAllMocks();
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

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Hello everyone!')).toBeInTheDocument();
    expect(screen.getByText('Game started!')).toBeInTheDocument();
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

    expect(screen.getByText('No messages')).toBeInTheDocument();
    expect(screen.getByText('Start the conversation!')).toBeInTheDocument();
  });

  it('filters out invalid messages', () => {
    const messagesWithInvalid = [
      ...validMessages,
      { id: '3', playerId: 'player2', playerName: undefined, content: 'Invalid message' },
      { id: '4', playerId: 'player3', playerName: 'Bob', content: undefined },
      null,
      undefined
    ] as ChatMessageType[];

    render(
      <Chat
        messages={messagesWithInvalid}
        currentPlayerId="player1"
        onSendMessage={mockOnSendMessage}
        disabled={false}
      />
    );

    // Should only show the valid messages
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Hello everyone!')).toBeInTheDocument();
    expect(screen.getByText('Game started!')).toBeInTheDocument();
    
    // Invalid messages should not appear
    expect(screen.queryByText('Invalid message')).not.toBeInTheDocument();
  });

  it('sends message when form is submitted', async () => {
    render(
      <Chat
        messages={validMessages}
        currentPlayerId="player1"
        onSendMessage={mockOnSendMessage}
        disabled={false}
      />
    );

    const input = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByRole('button', { name: 'Send' });

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

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

    const input = screen.getByPlaceholderText('Chat unavailable...');
    const sendButton = screen.getByRole('button', { name: 'Send' });

    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
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