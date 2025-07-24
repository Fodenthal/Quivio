"use client";

import { useState } from "react";
import { PlayerData, GameState } from "@shared/index";
import { GamePins } from "./GamePins";
import { AISettingsPanel } from "./AISettingsPanel";

interface GameLobbyProps {
  gameState: GameState;
  currentPlayerId: string;
  onPlayerReady: (ready: boolean) => void;
  onStartGame?: () => void;
  onSetTopic?: (topic: string) => void;
  onSetTopics?: (topics: string[]) => void;
  onSetDifficulty?: (difficulty: number) => void;
  onSetTargetScore?: (score: number) => void;
  onSetRoundTime?: (seconds: number) => void;
  onSetMaxPlayers?: (maxPlayers: number) => void;
}

export function GameLobby({ 
  gameState, 
  currentPlayerId, 
  onPlayerReady, 
  onStartGame,
  onSetTopic,
  onSetTopics,
  onSetDifficulty,
  onSetTargetScore,
  onSetRoundTime,
  onSetMaxPlayers
}: GameLobbyProps) {
  const [isTogglingReady, setIsTogglingReady] = useState(false);

  // Track the current topics input state from AISettingsPanel
  const [currentTopics, setCurrentTopics] = useState<string[]>(gameState.topics || [gameState.currentTopic || ""]);
  const hasAtLeastOneTopic = currentTopics.some(t => t && t.trim().length > 0);

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
    <div className="relative flex-1 bg-white/10 backdrop-blur-xl rounded-lg shadow-glass p-6 border border-white/20">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Room Code & Players */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Game Pin Display */}
          {gameState.gamePin && (
            <GamePins gamePin={gameState.gamePin} className="mb-4" />
          )}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold text-text-main">Players</h3>
            <div className="text-text-secondary text-sm font-medium">
              Players: {totalPlayers}/{gameState.maxPlayers} | Ready: {readyCount}/{totalPlayers}
            </div>
          </div>
          <div className="space-y-3">
            {playersArray.map((player, index) => (
              <div
                key={`${player.id}-${index}`}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
                  player.id === currentPlayerId
                    ? "bg-primary/20 border-primary"
                    : "bg-white/10 border-white/20"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{getPlayerStatusIcon(player)}</span>
                  <div>
                    <div className="flex items-center space-x-1">
                      <span className="font-semibold text-text-main text-lg">
                        {player.name}
                      </span>
                      {player.isHost && (
                        <span className="px-1.5 py-0.5 text-xs font-bold text-background bg-accent rounded-full">
                          Host
                        </span>
                      )}
                    </div>
                    <span className={`text-xs font-medium ${
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
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
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
          {/* Need more ready players message */}
          {isHost && !canStartGame && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
              <span className="text-sm text-yellow-300 font-semibold">
                Need {Math.max(2 - readyCount, 0)} more ready players
              </span>
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
        {/* Right: Host Controls */}
        {isHost && (
          <div className="flex-1 min-w-0 flex flex-col gap-4 border-l border-white/20 pl-8">
            <h3 className="text-xl font-semibold text-text-main mb-2">Host Controls</h3>
            {/* Always show Start Game button, only enable if at least 1 topic text box is filled */}
            <button
              onClick={onStartGame}
              disabled={!canStartGame || !hasAtLeastOneTopic}
              className={`w-full px-4 py-3 rounded-lg font-bold text-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background ${
                canStartGame && hasAtLeastOneTopic
                  ? "bg-primary hover:bg-opacity-90 text-white focus:ring-primary"
                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
              }`}
            >
              Start Game
            </button>
            <AISettingsPanel 
              gameState={gameState} 
              onSetTopic={onSetTopic} 
              onSetTopics={topics => {
                setCurrentTopics(topics);
                if (onSetTopics) onSetTopics(topics);
              }} 
              onSetDifficulty={onSetDifficulty} 
              onSetTargetScore={onSetTargetScore}
              onSetRoundTime={onSetRoundTime}
              onSetMaxPlayers={onSetMaxPlayers}
            />
            {/* Removed static Game Settings block */}
          </div>
        )}
      </div>
    </div>
  );
}