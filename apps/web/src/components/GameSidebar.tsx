import React from 'react';
import { PlayerList, Chat } from './index';

export const GameSidebar: React.FC = () => {
  return (
    <div className="space-y-6">
      <PlayerList />
      <Chat />
    </div>
  );
}; 