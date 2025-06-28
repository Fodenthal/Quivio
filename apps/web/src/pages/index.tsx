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
  const { isInRoom } = useGame();
  
  return isInRoom ? <GameRoom /> : <Lobby />;
};

export default GameApp;
