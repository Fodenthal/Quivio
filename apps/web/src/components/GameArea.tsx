import React from 'react';
import { useGame } from './GameProvider';
import { GameStatus, GamePrompt, GameControls } from './index';

export const GameArea: React.FC = () => {
  const { gameState } = useGame();

  if (!gameState) {
    return null;
  }

  return (
    <div className="space-y-6">
      <GameStatus />
      
      {gameState.gameStarted ? (
        <GamePrompt />
      ) : (
        <GameControls />
      )}
    </div>
  );
}; 