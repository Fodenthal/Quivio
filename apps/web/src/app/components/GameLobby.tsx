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
  onSetTopics?: (topics: string[]) => void;
  onSetDifficulty?: (difficulty: number) => void;
}

// Single Difficulty Slider Component
const DifficultySlider: React.FC<{
  value: number;
  onChange: (value: number) => void;
  getDifficultyLabel: (diff: number) => string;
  className?: string;
}> = ({ value, onChange, getDifficultyLabel, className = "" }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    onChange(newValue);
  };

  const getSliderBackground = (val: number) => {
    const percent = ((val - 1) / 4) * 100;
    return `linear-gradient(to right, 
      #6366f1 0%, 
      #6366f1 ${percent}%, 
      #e5e7eb ${percent}%, 
      #e5e7eb 100%)`;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <style jsx>{`
        .difficulty-slider {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
          pointer-events: auto;
        }
        
        .difficulty-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #6366f1;
          border: 2px solid white;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: all 0.15s ease-in-out;
          pointer-events: auto;
        }
        
        .difficulty-slider::-webkit-slider-thumb:hover {
          background: #5855eb;
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        
        .difficulty-slider::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #6366f1;
          border: 2px solid white;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: all 0.15s ease-in-out;
          border: none;
          pointer-events: auto;
        }
        
        .difficulty-slider::-moz-range-thumb:hover {
          background: #5855eb;
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        
        .difficulty-slider::-moz-range-track {
          background: transparent;
          border: none;
        }
        
        .difficulty-slider:focus {
          outline: none;
        }
        
        .difficulty-slider:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
        }
      `}</style>
      
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-primary">
          {getDifficultyLabel(value)}
        </span>
      </div>
      
      <div className="relative">
        {/* Track background */}
        <div 
          className="w-full h-2 rounded-lg"
          style={{ background: getSliderBackground(value) }}
        />
        
        {/* Single slider */}
        <input
          type="range"
          min="1"
          max="5"
          value={value}
          onChange={handleChange}
          className="difficulty-slider absolute inset-0 w-full h-2 bg-transparent rounded-lg"
        />
      </div>
      
      <div className="flex justify-between text-xs text-text-secondary px-0.5">
        <span className="text-center">VE</span>
        <span className="text-center">E</span>
        <span className="text-center">M</span>
        <span className="text-center">H</span>
        <span className="text-center">VH</span>
      </div>
    </div>
  );
};

export function GameLobby({ 
  gameState, 
  currentPlayerId, 
  onPlayerReady, 
  onStartGame,
  onSetTopic,
  onSetTopics,
  onSetDifficulty
}: GameLobbyProps) {
  const [isTogglingReady, setIsTogglingReady] = useState(false);
  const [topics, setTopics] = useState<string[]>(gameState.topics || [gameState.currentTopic || ""]);
  
  // Use 5-tier difficulty system directly (1-5)
  const currentDifficulty = Math.min(5, Math.max(1, gameState.currentDifficulty)); // Already 1-5 scale
  const [difficulty, setDifficulty] = useState(currentDifficulty);

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

  const handleTopicChange = (index: number, value: string) => {
    const newTopics = [...topics];
    newTopics[index] = value;
    setTopics(newTopics);
  };

  const handleTopicApply = (index: number) => {
    const topicToSet = topics[index]?.trim();
    if (onSetTopic && topicToSet && topicToSet !== gameState.currentTopic) {
      onSetTopic(topicToSet);
    }
  };

  const handleTopicsApply = () => {
    const validTopics = topics.filter(t => t.trim().length > 0).map(t => t.trim());
    if (validTopics.length > 0 && onSetTopics) {
      onSetTopics(validTopics);
    }
  };

  const handleTopicKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTopicApply(index);
    }
  };

  const handleTopicBlur = (index: number) => {
    handleTopicApply(index);
  };

  const handleAddTopic = () => {
    setTopics([...topics, ""]);
  };

  const handleRemoveTopic = (index: number) => {
    if (topics.length > 1) {
      const newTopics = topics.filter((_, i) => i !== index);
      setTopics(newTopics);
    }
  };

  const handleDifficultyChange = (value: number) => {
    setDifficulty(value);
    
    if (onSetDifficulty && value !== gameState.currentDifficulty) {
      onSetDifficulty(value);
    }
  };

  const getDifficultyLabel = (diff: number): string => {
    switch(diff) {
      case 1: return "Very Easy";
      case 2: return "Easy";
      case 3: return "Medium";
      case 4: return "Hard";
      case 5: return "Very Hard";
      default: return "Medium";
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
              
              {/* Two-column layout: Topics on left, Difficulty on right */}
              <div className="flex gap-6">
                {/* Topics Section - Left Side (takes more space) */}
                <div className="flex-1 space-y-2">
                  <label className="block text-sm font-medium text-text-main">Game Topics</label>
                  <div className="space-y-2">
                    {topics.map((topic, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={topic}
                          onChange={(e) => handleTopicChange(index, e.target.value)}
                          onKeyDown={(e) => handleTopicKeyDown(index, e)}
                          onBlur={() => handleTopicBlur(index)}
                          placeholder="e.g., Space Exploration, Ancient History..."
                          className="flex-1 px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-md text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        {topics.length > 1 && (
                          <button
                            onClick={() => handleRemoveTopic(index)}
                            className="px-2 py-2 text-xs font-medium bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                          >
                            −
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={handleAddTopic}
                      className="w-full px-3 py-2 text-sm font-medium bg-white/10 text-text-main border border-white/20 rounded-md hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                    >
                      + Add Another Topic
                    </button>
                    <button
                      onClick={handleTopicsApply}
                      disabled={topics.filter(t => t.trim().length > 0).length === 0}
                      className="w-full px-3 py-2 text-sm font-medium bg-primary/20 text-primary border border-primary/30 rounded-md hover:bg-primary/30 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Apply All Topics
                    </button>
                  </div>
                  <div className="text-xs text-text-secondary">
                    Active Topic: <span className="font-bold text-text-main">{gameState.currentTopic}</span>
                    {gameState.topics && gameState.topics.length > 1 && (
                      <>
                        <br />
                        <span className="text-text-secondary/70">
                          ({gameState.currentTopicIndex + 1} of {gameState.topics.length}: {gameState.topics.join(", ")})
                        </span>
                      </>
                    )}
                    <br />
                    <span className="text-text-secondary/70">Use &quot;Apply All Topics&quot; to set multiple topics for equal rotation</span>
                  </div>
                </div>

                {/* Difficulty Section - Right Side */}
                <div className="w-64 space-y-2">
                  <label className="block text-sm font-medium text-text-main">Difficulty Level</label>
                  <DifficultySlider
                    value={difficulty}
                    onChange={handleDifficultyChange}
                    getDifficultyLabel={getDifficultyLabel}
                  />
                  <div className="text-xs text-text-secondary">
                    Level: <span className="font-bold text-text-main">{getDifficultyLabel(difficulty)}</span>
                  </div>
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