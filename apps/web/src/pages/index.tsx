import React from 'react';
import { GameProvider, useGame } from '../components/GameProvider';
import { Lobby } from '../components/Lobby';
import { GameRoom } from '../components/GameRoom';

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
