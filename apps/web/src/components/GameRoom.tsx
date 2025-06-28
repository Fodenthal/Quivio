import React from 'react';
import { useGame } from './GameProvider';
import { GameHeader } from './GameHeader';
import { GameArea } from './GameArea';
import { GameSidebar } from './GameSidebar';

export const GameRoom: React.FC = () => {
  const { gameState, room } = useGame();

  if (!gameState || !room) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <GameHeader />
      
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <GameArea />
          </div>
          <div className="lg:col-span-1">
            <GameSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}; 