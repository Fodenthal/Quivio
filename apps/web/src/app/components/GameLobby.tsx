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

  const playersArray = Array.from(gameState.players.values())
    .filter(player => player && player.id)
    .sort((a, b) => {
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
    <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-glass p-8 border border-white/20">
      <div className="mb-8 text-center">
        <h2 className="text-4xl font-bold text-text-main mb-2">
          Game Lobby
        </h2>
        <p className="text-text-secondary">
          Players: {totalPlayers}/{gameState.maxPlayers} | Ready: {readyCount}/{totalPlayers}
        </p>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold text-text-main mb-4">Players</h3>
        <div className="space-y-3">
          {playersArray.map((player, index) => (
            <div
              key={`${player.id}-${index}`}
              className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 ${
                player.id === currentPlayerId
                  ? "bg-primary/20 border-primary"
                  : "bg-white/10 border-white/20"
              }`}
            >
              <div className="flex items-center space-x-4">
                <span className="text-2xl">{getPlayerStatusIcon(player)}</span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-text-main">
                      {player.name}
                    </span>
                    {player.isHost && (
                      <span className="px-2 py-1 text-xs font-bold text-background bg-accent rounded-full">
                        Host
                      </span>
                    )}
                  </div>
                  <span className={`text-sm font-medium ${
                    player.ready ? "text-green-400" : "text-text-secondary"
                  }`}>
                    {getPlayerStatusText(player)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-text-main">
                  {player.score}
                </div>
                <div className="text-sm text-text-secondary">Score</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={handleReadyToggle}
          disabled={isTogglingReady}
          className={`w-full px-4 py-3 rounded-lg font-bold text-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background ${
            currentPlayer?.ready
              ? "bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-400"
              : "bg-green-500 hover:bg-green-600 text-white focus:ring-green-400"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isTogglingReady
            ? "Updating..."
            : currentPlayer?.ready
            ? "I'm Not Ready"
            : "I'm Ready!"
          }
        </button>
      </div>

      {isHost && (
        <div className="pt-6 border-t border-white/20">
          <h3 className="text-xl font-semibold text-text-main mb-4">Host Controls</h3>
          <div className="space-y-4">
            <button
              onClick={handleStartGame}
              disabled={!canStartGame}
              className={`w-full px-4 py-3 rounded-lg font-bold text-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background ${
                canStartGame
                  ? "bg-primary hover:bg-opacity-90 text-white focus:ring-primary"
                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
              }`}
            >
              {canStartGame ? "Start Game" : `Need ${Math.max(2 - readyCount, 0)} more ready players`}
            </button>
            
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <h4 className="text-md font-semibold text-text-main mb-2">Game Settings</h4>
              <div className="text-sm text-text-secondary space-y-1">
                <div>Target Score: <span className="font-bold text-text-main">{gameState.targetScore}</span></div>
                <div>Round Time: <span className="font-bold text-text-main">{gameState.roundTime / 1000}s</span></div>
                <div>Max Players: <span className="font-bold text-text-main">{gameState.maxPlayers}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {totalPlayers < 2 && (
        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-sm text-yellow-300 text-center">
            Waiting for more players to join. Share the room link to invite friends!
          </p>
        </div>
      )}
    </div>
  );
}