"use client";

import { useState, useMemo, useCallback } from "react";
import { GameState } from "@shared/index";
import { DifficultySlider } from "./DifficultySlider";
import { useDebouncedEffect } from "../../hooks/useDebouncedEffect";

interface AISettingsPanelProps {
  gameState: GameState;
  onSetTopic?: (topic: string) => void;
  onSetTopics?: (topics: string[]) => void;
  onSetDifficulty?: (difficulty: number) => void;
}

export function AISettingsPanel({ 
  gameState, 
  onSetTopic,
  onSetTopics,
  onSetDifficulty
}: AISettingsPanelProps) {
  const [topics, setTopics] = useState<string[]>(gameState.topics || [gameState.currentTopic || ""]);
  
  // Use 5-tier difficulty system directly (1-5)
  const currentDifficulty = Math.min(5, Math.max(1, gameState.currentDifficulty)); // Already 1-5 scale
  const [difficulty, setDifficulty] = useState(currentDifficulty);

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

  return (
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
  );
}