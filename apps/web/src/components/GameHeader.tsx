import React from 'react';
import { useGame } from './GameProvider';

export const GameHeader: React.FC = () => {
  const { room, leaveRoom, gameState } = useGame();

  const copyRoomId = () => {
    if (room?.sessionId) {
      navigator.clipboard.writeText(room.sessionId);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">PopReplay</h1>
            
            {room && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Room:</span>
                <div className="flex items-center space-x-2">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                    {room.sessionId}
                  </code>
                  <button
                    onClick={copyRoomId}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy room ID"
                  >
                    📋
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {gameState && (
              <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <span>Players:</span>
                  <span className="font-medium">{gameState.players?.size || 0}</span>
                </div>
                {gameState.gameStarted && (
                  <div className="flex items-center space-x-1">
                    <span>Round:</span>
                    <span className="font-medium">{gameState.currentRound}</span>
                  </div>
                )}
              </div>
            )}
            
            <button
              onClick={leaveRoom}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              Leave Room
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}; 