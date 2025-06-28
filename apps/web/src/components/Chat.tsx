import React, { useState, useRef, useEffect } from 'react';
import { useGame } from './GameProvider';
import { ChatMessage } from '@shared/index';

export const Chat: React.FC = () => {
  const { gameState, sendChat } = useGame();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [gameState?.chatMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendChat(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getPlayerName = (playerId: string) => {
    const player = gameState?.players?.get(playerId);
    return player?.name || playerId.slice(0, 6);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">Chat</h2>
      
      <div className="h-64 overflow-y-auto mb-4 space-y-2 border border-gray-200 rounded-lg p-3">
        {gameState?.chatMessages && Array.from(gameState.chatMessages.values()).map((msg: ChatMessage, index: number) => (
          <div key={index} className="text-sm">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-blue-600">
                {getPlayerName(msg.playerId)}
              </span>
              <span className="text-gray-400 text-xs">
                {formatTime(msg.timestamp)}
              </span>
            </div>
            <div className="text-gray-800 ml-0 mt-1">
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          placeholder="Type a message..."
          maxLength={200}
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          Send
        </button>
      </form>
    </div>
  );
}; 