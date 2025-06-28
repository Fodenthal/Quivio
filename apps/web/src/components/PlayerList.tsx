import React from 'react';
import { useGame } from './GameProvider';
import { PlayerData } from '@shared/index';

export const PlayerList: React.FC = () => {
  const { gameState } = useGame();

  if (!gameState?.players) return null;

  const players = Array.from(gameState.players.values()).sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">
        Players ({players.length})
      </h2>
      
      <div className="space-y-2">
        {players.map((player: PlayerData) => (
          <div
            key={player.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">{player.name}</span>
                {player.isHost && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Host
                  </span>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">
                {player.score} pts
              </div>
              <div className={`text-xs ${player.ready ? 'text-green-600' : 'text-gray-500'}`}>
                {player.ready ? 'Ready' : 'Not Ready'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 