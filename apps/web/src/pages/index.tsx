import React from 'react';
import { GameProvider, useGame, Lobby, GameRoom } from '../components';

const GameApp: React.FC = () => {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
};

const GameContent: React.FC = () => {
  const { isInRoom, isLoading } = useGame();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to room...</p>
        </div>
      </div>
    );
  }
  
  return isInRoom ? <GameRoom /> : <Lobby />;
};

export default GameApp;
