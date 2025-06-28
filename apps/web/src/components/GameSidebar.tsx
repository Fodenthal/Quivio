import React from 'react';
import { PlayerList } from './PlayerList';
import { Chat } from './Chat';

export const GameSidebar: React.FC = () => {
  return (
    <div className="space-y-6">
      <PlayerList />
      <Chat />
    </div>
  );
}; 