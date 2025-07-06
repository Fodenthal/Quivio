"use client";

import { useState } from "react";
import { PlayerData, GameState } from "@shared/index";

interface GameLobbyProps {
  gameState: GameState;
  currentPlayerId: string;
  onPlayerReady: (ready: boolean) => void;
  onStartGame?: () => void;
}

export function GameLobby({ 
  gameState, 
  currentPlayerId, 
  onPlayerReady, 
  onStartGame 
}: GameLobbyProps) {
  const [isTogglingReady, setIsTogglingReady] = useState(false);

  const currentPlayer = gameState.players.get(currentPlayerId);
  const isHost = currentPlayer?.isHost || false;
  const playersArray = Array.from(gameState.players.values()).sort((a, b) => {
    // Sort by: host first, then by join time
    if (a.isHost !== b.isHost) return a.isHost ? -1 : 1;
    return a.joinedAt - b.joinedAt;
  });

  const readyCount = playersArray.filter(p => p.ready).length;
  const totalPlayers = playersArray.length;
  const canStartGame = gameState.canStart && readyCount > 1;

  const handleReadyToggle = async () => {
    if (isTogglingReady || !currentPlayer) return;
    
    setIsTogglingReady(true);
    try {
      await onPlayerReady(!currentPlayer.ready);
    } catch (error) {
      console.error("Failed to toggle ready state:", error);
    } finally {
      setIsTogglingReady(false);
    }
  };

  const handleStartGame = () => {
    if (onStartGame && canStartGame) {
      onStartGame();
    }
  };

  const getPlayerStatusIcon = (player: PlayerData) => {
    if (player.ready) {
      return "✅";
    }
    return "⏳";
  };

  const getPlayerStatusText = (player: PlayerData) => {
    if (player.ready) {
      return "Ready";
    }
    return "Not Ready";
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Game Lobby
        </h2>
        <p className="text-gray-600">
          Players: {totalPlayers}/{gameState.maxPlayers} • Ready: {readyCount}/{totalPlayers}
        </p>
      </div>

      {/* Players List */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Players</h3>
        <div className="space-y-2">
          {playersArray.map((player) => (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                player.id === currentPlayerId
                  ? "bg-blue-50 border-blue-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{getPlayerStatusIcon(player)}</span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {player.name}
                    </span>
                    {player.isHost && (
                      <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">
                        Host
                      </span>
                    )}
                    {player.id === currentPlayerId && (
                      <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <span className={`text-sm ${
                    player.ready ? "text-green-600" : "text-gray-500"
                  }`}>
                    {getPlayerStatusText(player)}
                  </span>
                </div>
              </div>
              
              {/* Score display */}
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  Score: {player.score}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ready Toggle Button */}
      <div className="mb-6">
        <button
          onClick={handleReadyToggle}
          disabled={isTogglingReady}
          className={`w-full px-4 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            currentPlayer?.ready
              ? "bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500"
              : "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isTogglingReady
            ? "Updating..."
            : currentPlayer?.ready
            ? "Mark as Not Ready"
            : "Mark as Ready"
          }
        </button>
      </div>

      {/* Host Controls */}
      {isHost && (
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Host Controls</h3>
          <div className="space-y-3">
            <button
              onClick={handleStartGame}
              disabled={!canStartGame}
              className={`w-full px-4 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                canStartGame
                  ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {canStartGame ? "Start Game" : `Need ${Math.max(2 - readyCount, 0)} more ready players`}
            </button>
            
            {/* Game Settings Display */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Game Settings</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Target Score: {gameState.targetScore} points</div>
                <div>Round Time: {gameState.roundTime / 1000} seconds</div>
                <div>Max Players: {gameState.maxPlayers}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Rules or Instructions */}
      {totalPlayers < 2 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 Waiting for more players to join. Share the room link to invite friends!
          </p>
        </div>
      )}
    </div>
  );
} 