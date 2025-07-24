"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { GameState } from "@shared/index";
import { DifficultySlider } from "./DifficultySlider";
import { useDebouncedEffect } from "../../hooks/useDebouncedEffect";

interface AISettingsPanelProps {
  gameState: GameState;
  onSetTopic?: (topic: string) => void;
  onSetTopics?: (topics: string[]) => void;
  onSetDifficulty?: (difficulty: number) => void;
  onSetTargetScore?: (score: number) => void;
  onSetRoundTime?: (seconds: number) => void;
  onSetMaxPlayers?: (maxPlayers: number) => void;
}

export function AISettingsPanel({ 
  gameState, 
  onSetTopic,
  onSetTopics,
  onSetDifficulty,
  onSetTargetScore,
  onSetRoundTime,
  onSetMaxPlayers
}: AISettingsPanelProps) {
  const [topics, setTopics] = useState<string[]>(gameState.topics || [gameState.currentTopic || ""]);
  
  // Use 5-tier difficulty system directly (1-5)
  const currentDifficulty = Math.min(5, Math.max(1, gameState.currentDifficulty)); // Already 1-5 scale
  const [difficulty, setDifficulty] = useState(currentDifficulty);
  const [targetScore, setTargetScore] = useState(gameState.targetScore || 10);
  const [roundTime, setRoundTime] = useState(Math.round((gameState.roundTime || 60000) / 1000));
  const [maxPlayers, setMaxPlayers] = useState(gameState.maxPlayers || 8);

  // Memoize valid topics calculation for performance
  const validTopics = useMemo(() => 
    topics.filter(t => t.trim().length > 0).map(t => t.trim()),
    [topics]
  );

  // Unified auto-update logic: always use onSetTopics regardless of count
  const handleAutoTopicUpdate = useCallback(() => {
    if (onSetTopics && validTopics.length > 0) {
      onSetTopics(validTopics);
    }
  }, [validTopics, onSetTopics]);

  // Apply updates automatically with debounce
  useDebouncedEffect(handleAutoTopicUpdate, [validTopics], 500);

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

  const handleTargetScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, Math.min(100, Number(e.target.value)));
    setTargetScore(value);
    if (onSetTargetScore) onSetTargetScore(value);
  };
  const handleRoundTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(10, Math.min(600, Number(e.target.value)));
    setRoundTime(value);
    if (onSetRoundTime) onSetRoundTime(value);
  };

  const handleMaxPlayersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(2, Math.min(20, Number(e.target.value)));
    setMaxPlayers(value);
    if (onSetMaxPlayers) onSetMaxPlayers(value);
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

  return (
    <div className="bg-white/10 rounded-lg p-4 border border-white/20 space-y-4">
      <h4 className="text-md font-semibold text-text-main mb-2">AI Question Settings</h4>
      {/* Topics Section */}
      <div className="space-y-2">
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
        </div>
        <div className="text-xs text-text-secondary">
          <span className="text-text-secondary/70">
            Topics update automatically as you type.
            {validTopics.length > 1 && " Multiple topics will rotate during the game."}
          </span>
        </div>
      </div>
      {/* Difficulty Section - now below topics */}
      <div className="space-y-2 mt-4">
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
      {/* Target Score, Round Time, Max Players - editable by host, now in a row */}
      <div className="flex flex-row gap-4 mt-4">
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-text-main mb-1">Target Score</label>
          <input
            type="number"
            min={1}
            max={100}
            value={targetScore}
            onChange={handleTargetScoreChange}
            className="w-28 px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-md text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-text-main mb-1">Round Time (s)</label>
          <input
            type="number"
            min={10}
            max={600}
            value={roundTime}
            onChange={handleRoundTimeChange}
            className="w-28 px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-md text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-text-main mb-1">Max Players</label>
          <input
            type="number"
            min={2}
            max={20}
            value={maxPlayers}
            onChange={handleMaxPlayersChange}
            className="w-28 px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-md text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
    </div>
  );
}