"use client";

import { useState } from "react";
import { PlayerData, GameState } from "@shared/index";
import { GamePins } from "./GamePins";

interface GameLobbyProps {
  gameState: GameState;
  currentPlayerId: string;
  onPlayerReady: (ready: boolean) => void;
  onStartGame?: () => void;
  onSetTopic?: (topic: string) => void;
  onSetDifficulty?: (difficulty: number) => void;
}

export function GameLobby({ 
  gameState, 
  currentPlayerId, 
  onPlayerReady, 
  onStartGame,
  onSetTopic,
  onSetDifficulty
}: GameLobbyProps) {
  const [isTogglingReady, setIsTogglingReady] = useState(false);
  const [topicInput, setTopicInput] = useState(gameState.currentTopic || "");
  const [difficultyInput, setDifficultyInput] = useState(gameState.currentDifficulty || 5);

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

  const handleTopicChange = () => {
    if (onSetTopic && topicInput.trim() && topicInput.trim() !== gameState.currentTopic) {
      onSetTopic(topicInput.trim());
    }
  };

  const handleDifficultyChange = (newDifficulty: number) => {
    setDifficultyInput(newDifficulty);
    if (onSetDifficulty && newDifficulty !== gameState.currentDifficulty) {
      onSetDifficulty(newDifficulty);
    }
  };

  const getDifficultyLabel = (diff: number): string => {
    if (diff <= 2) return "Very Easy";
    if (diff <= 4) return "Easy";
    if (diff <= 6) return "Medium";
    if (diff <= 8) return "Hard";
    return "Expert";
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
    <div className="relative flex-1 bg-white/10 backdrop-blur-xl rounded-lg shadow-glass p-6 border border-white/20 space-y-6">
      {/* Game Pin Display - Show prominently for easy sharing */}
      {gameState.gamePin && (
        <GamePins gamePin={gameState.gamePin} className="mb-6" />
      )}

      <div className="flex items-center justify-between mb-4">
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
            
            {/* AI Question Settings */}
            <div className="bg-white/10 rounded-lg p-4 border border-white/20 space-y-4">
              <h4 className="text-md font-semibold text-text-main mb-2">AI Question Settings</h4>
              
              {/* Topic Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-main">Current Topic</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleTopicChange()}
                    placeholder="e.g., Space Exploration, Ancient History..."
                    className="flex-1 px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-md text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleTopicChange}
                    disabled={!topicInput.trim() || topicInput.trim() === gameState.currentTopic}
                    className="px-3 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Set
                  </button>
                </div>
                <div className="text-xs text-text-secondary">
                  Active: <span className="font-bold text-text-main">{gameState.currentTopic}</span>
                </div>
              </div>

              {/* Difficulty Slider */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-main">Difficulty Level</label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">Generic</span>
                    <span className="text-sm font-bold text-primary">{getDifficultyLabel(difficultyInput)}</span>
                    <span className="text-xs text-text-secondary">Unique</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={difficultyInput}
                    onChange={(e) => handleDifficultyChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>1</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>
                <div className="text-xs text-text-secondary">
                  Active: <span className="font-bold text-text-main">{getDifficultyLabel(gameState.currentDifficulty)}</span> ({gameState.currentDifficulty}/10)
                </div>
              </div>
            </div>

            {/* Game Settings */}
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