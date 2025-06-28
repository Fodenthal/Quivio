import React from 'react';
import { useGame } from './GameProvider';

export const GameStatus: React.FC = () => {
  const { gameState } = useGame();

  if (!gameState) return null;

  const formatTime = (ms: number) => Math.ceil(ms / 1000);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Game Status</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {gameState.gameStarted ? 'Playing' : 'Waiting'}
          </div>
          <div className="text-sm text-gray-600">Status</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {gameState.currentRound || 0}
          </div>
          <div className="text-sm text-gray-600">Round</div>
        </div>
        
        {gameState.gameStarted && (
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {formatTime(gameState.roundTimeRemaining || 0)}
            </div>
            <div className="text-sm text-gray-600">Time Left</div>
          </div>
        )}
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {gameState.targetScore || 10}
          </div>
          <div className="text-sm text-gray-600">Target Score</div>
        </div>
      </div>
      
      {gameState.gamePaused && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <div className="text-yellow-600 mr-2">⚠️</div>
            <span className="text-yellow-800">Game paused - waiting for more players</span>
          </div>
        </div>
      )}
    </div>
  );
}; 