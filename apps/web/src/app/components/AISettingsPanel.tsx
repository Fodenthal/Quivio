"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { GameState } from "@shared/index";
import { DifficultySlider } from "./DifficultySlider";
import { useDebouncedEffect } from "../../hooks/useDebouncedEffect";
import { usePopularTopics } from "../../hooks/usePopularTopics";

interface AISettingsPanelProps {
  gameState: GameState;
  isReadOnly?: boolean;
  onSetTopics?: (topics: string[]) => void;
  onSetDifficulty?: (difficulty: number) => void;
  onSetTargetScore?: (score: number) => void;
  onSetRoundTime?: (seconds: number) => void;
  onSetMaxPlayers?: (maxPlayers: number) => void;
}

export function AISettingsPanel({ 
  gameState, 
  isReadOnly = false,
  onSetTopics,
  onSetDifficulty,
  onSetTargetScore,
  onSetRoundTime,
  onSetMaxPlayers
}: AISettingsPanelProps) {
  const [topics, setTopics] = useState<string[]>(gameState.topics || [gameState.currentTopic || ""]);
  const [newTopic, setNewTopic] = useState("");
  const { topics: popularTopics, isLoading: isPopularLoading } = usePopularTopics({ refreshMs: 120000, limit: 100 });
  
  // Use 5-tier difficulty system directly (1-5)
  const currentDifficulty = Math.min(5, Math.max(1, gameState.currentDifficulty)); // Already 1-5 scale
  const [difficulty, setDifficulty] = useState(currentDifficulty);
  const [targetScore, setTargetScore] = useState(gameState.targetScore || 10);
  const [roundTime, setRoundTime] = useState(Math.round((gameState.roundTime || 60000) / 1000));
  const [maxPlayers, setMaxPlayers] = useState(gameState.maxPlayers || 8);

  // Sync internal state with gameState changes for real-time updates
  useEffect(() => {
    setTopics(gameState.topics || [gameState.currentTopic || ""]);
  }, [gameState.topics, gameState.currentTopic]);

  useEffect(() => {
    const newDifficulty = Math.min(5, Math.max(1, gameState.currentDifficulty));
    setDifficulty(newDifficulty);
  }, [gameState.currentDifficulty]);

  useEffect(() => {
    setTargetScore(gameState.targetScore || 10);
  }, [gameState.targetScore]);

  useEffect(() => {
    setRoundTime(Math.round((gameState.roundTime || 60000) / 1000));
  }, [gameState.roundTime]);

  useEffect(() => {
    setMaxPlayers(gameState.maxPlayers || 8);
  }, [gameState.maxPlayers]);

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

  const handleAddTopicChip = () => {
    const trimmed = newTopic.trim();
    if (trimmed && !topics.includes(trimmed)) {
      setTopics([...topics, trimmed]);
      setNewTopic("");
    }
  };

  const handleNewTopicKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddTopicChip();
    }
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
    <div className="bg-white/10 rounded-2xl shadow-lg p-4 border border-white/20 max-w-xl w-full mx-auto space-y-4">
      {/* Game Topics Section */}
      <section>
        <h3 className="text-lg font-semibold text-text-main mb-2">Game Topics</h3>
        <div className="flex flex-wrap gap-2 mb-2">
          {topics.map((topic, index) => (
            <span key={index} className="flex items-center bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
              {topic}
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => handleRemoveTopic(index)}
                  className="ml-2 text-primary hover:text-red-500 focus:outline-none"
                  aria-label={`Remove topic ${topic}`}
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
        <div className="relative">
          <div className="flex gap-2 items-center">
            <input
            type="text"
            value={newTopic}
            onChange={e => setNewTopic(e.target.value)}
            onKeyDown={handleNewTopicKeyDown}
            placeholder="Add a topic..."
            disabled={isReadOnly}
            className={`flex-1 px-3 py-2 text-sm border rounded-md placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary ${
              isReadOnly 
                ? "bg-white/5 border-white/10 text-text-secondary cursor-not-allowed" 
                : "bg-white/10 border-white/20 text-text-main"
            }`}
            />
            {!isReadOnly && (
              <button
                type="button"
                onClick={handleAddTopicChip}
                className="hidden sm:inline-flex px-3 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                + Add
              </button>
            )}
          </div>

          <div className="mt-3">
            <div className="text-sm font-medium text-text-main mb-2">Popular Topics</div>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1" aria-busy={isPopularLoading}>
              {popularTopics.length > 0 ? (
                popularTopics.slice(0, 36).map((t) => (
                  <button
                    key={t.topic}
                    type="button"
                    disabled={isReadOnly}
                    title={isReadOnly ? "Only the host can select topics" : undefined}
                    className={`text-left px-3 py-2 text-sm rounded-md border select-none touch-manipulation ${
                      isReadOnly
                        ? "bg-white/5 border-white/10 text-text-secondary cursor-not-allowed opacity-60"
                        : "bg-white/5 hover:bg-white/10 border-white/5"
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (isReadOnly) return;
                      if (!topics.includes(t.topic)) setTopics([...topics, t.topic]);
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      if (isReadOnly) return;
                      if (!topics.includes(t.topic)) setTopics([...topics, t.topic]);
                    }}
                  >
                    <div className="truncate text-text-main">{t.topic}</div>
                    <div className="text-xs text-text-secondary">{t.questionCount} questions</div>
                  </button>
                ))
              ) : isPopularLoading ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={`skeleton-${i}`}
                    className="h-10 rounded-md bg-white/5 border border-white/10 animate-pulse"
                  />
                ))
              ) : (
                <div className="col-span-2 text-xs text-text-secondary/70 italic">
                  Popular topics are temporarily unavailable.
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Read-only hint removed per request */}
      </section>
      <div className="my-4 border-t border-white/10" />
      {/* Difficulty Section */}
      <section>
        <h3 className="text-lg font-semibold text-text-main mb-2">Difficulty Level</h3>
        <div className="space-y-2">
          <DifficultySlider
            value={difficulty}
            onChange={handleDifficultyChange}
            getDifficultyLabel={getDifficultyLabel}
            disabled={isReadOnly}
          />
          {/* Read-only hint removed per request */}
        </div>
      </section>
      <div className="my-4 border-t border-white/10" />
      {/* Game Settings Section */}
      <section>
        <h3 className="text-lg font-semibold text-text-main mb-2">Game Settings</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 mt-2">
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-text-main mb-1">Target Score</label>
            <input
              type="number"
              min={1}
              max={100}
              value={targetScore}
              onChange={handleTargetScoreChange}
              disabled={isReadOnly}
              inputMode="numeric"
              pattern="[0-9]*"
              className={`w-full sm:w-28 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                isReadOnly 
                  ? "bg-white/5 border-white/10 text-text-secondary cursor-not-allowed" 
                  : "bg-white/10 border-white/20 text-text-main"
              }`}
            />
          </div>
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-text-main mb-1">Round Time</label>
            <input
              type="number"
              min={10}
              max={600}
              value={roundTime}
              onChange={handleRoundTimeChange}
              disabled={isReadOnly}
              inputMode="numeric"
              pattern="[0-9]*"
              className={`w-full sm:w-28 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                isReadOnly 
                  ? "bg-white/5 border-white/10 text-text-secondary cursor-not-allowed" 
                  : "bg-white/10 border-white/20 text-text-main"
              }`}
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
              disabled={isReadOnly}
              inputMode="numeric"
              pattern="[0-9]*"
              className={`w-full sm:w-28 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                isReadOnly 
                  ? "bg-white/5 border-white/10 text-text-secondary cursor-not-allowed" 
                  : "bg-white/10 border-white/20 text-text-main"
              }`}
            />
          </div>
        </div>
        {/* Read-only hint removed per request */}
      </section>
    </div>
  );
}