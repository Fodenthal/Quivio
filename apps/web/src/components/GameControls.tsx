import React from 'react';
import { useGame } from './GameProvider';
import { PlayerData } from '@shared/index';

function isPlayerMap(players: unknown): players is Map<string, PlayerData> {
  return typeof (players as { get?: unknown }).get === 'function';
}

export const GameControls: React.FC = () => {
  const { gameState, setReady, startGame, currentPlayerId } = useGame();

  if (!gameState) return null;

  if (!gameState.players) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Game Controls</h2>
        <div className="text-center text-gray-600">
          Loading game state...
        </div>
      </div>
    );
  }

  let currentPlayer: PlayerData | null = null;
  let readyPlayers: PlayerData[] = [];
  let totalPlayers = 0;

  if (isPlayerMap(gameState.players)) {
    // Server-side or test
    currentPlayer = currentPlayerId ? gameState.players.get(currentPlayerId) ?? null : null;
    readyPlayers = Array.from(gameState.players.values()).filter((p) => p.ready);
    totalPlayers = gameState.players.size;
  } else {
    // Client-side Colyseus serialization
    const playersObj = gameState.players as Record<string, PlayerData>;
    currentPlayer = currentPlayerId ? playersObj[currentPlayerId] ?? null : null;
    readyPlayers = Object.values(playersObj).filter((p) => p.ready);
    totalPlayers = Object.keys(playersObj).length;
  }

  let isHost = false;
  if (currentPlayer) {
    isHost = currentPlayer.isHost || (currentPlayerId === gameState.hostId);
  }
  console.log('Current player:', currentPlayer, 'isHost:', isHost, 'hostId:', gameState.hostId);
  console.log('All players:', gameState.players);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Game Controls</h2>
      
      <div className="space-y-6">
        {/* Ready Status */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Ready Status</span>
            <span className="text-sm text-gray-600">
              {readyPlayers.length}/{totalPlayers} ready
            </span>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setReady(true)}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              Ready
            </button>
            <button
              onClick={() => setReady(false)}
              className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors"
            >
              Not Ready
            </button>
          </div>
        </div>

        {/* Start Game */}
        {gameState.canStart && isHost && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-center">
              <p className="text-sm text-blue-800 mb-3">
                All players are ready! You can start the game.
              </p>
              <button
                onClick={startGame}
                className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
              >
                Start Game
              </button>
            </div>
          </div>
        )}

        {/* Waiting for players */}
        {!gameState.canStart && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-center">
              <p className="text-sm text-yellow-800">
                Waiting for at least 2 players to be ready...
              </p>
            </div>
          </div>
        )}

        {/* Game settings */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Game Settings</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Target Score:</span>
              <span className="ml-2 font-medium">{gameState.targetScore || 10}</span>
            </div>
            <div>
              <span className="text-gray-600">Round Time:</span>
              <span className="ml-2 font-medium">{Math.ceil((gameState.roundTime || 30000) / 1000)}s</span>
            </div>
            <div>
              <span className="text-gray-600">Max Players:</span>
              <span className="ml-2 font-medium">{gameState.maxPlayers || 8}</span>
            </div>
            <div>
              <span className="text-gray-600">Current Players:</span>
              <span className="ml-2 font-medium">{totalPlayers}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 