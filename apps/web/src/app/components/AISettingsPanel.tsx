"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { GameState } from "@shared/index";

import { useDebouncedEffect } from "../../hooks/useDebouncedEffect";
import { usePopularTopics } from "../../hooks/usePopularTopics";

interface AISettingsPanelProps {
  gameState: GameState;
  isReadOnly?: boolean;
  onSetTopics?: (topics: string[]) => void;

  onSetTargetScore?: (score: number) => void;
  onSetRoundTime?: (seconds: number) => void;
  onSetMaxPlayers?: (maxPlayers: number) => void;
}

export function AISettingsPanel({ 
  gameState, 
  isReadOnly = false,
  onSetTopics,
  onSetTargetScore,
  onSetRoundTime,
  onSetMaxPlayers
}: AISettingsPanelProps) {
  const [topics, setTopics] = useState<string[]>(gameState.topics || [gameState.currentTopic || ""]);
  const [newTopic, setNewTopic] = useState("");
  const { topics: popularTopics, isLoading: isPopularLoading } = usePopularTopics({ refreshMs: 120000, limit: 100 });
  

  const [targetScore, setTargetScore] = useState(gameState.targetScore || 10);
  const [roundTime, setRoundTime] = useState(Math.round((gameState.roundTime || 60000) / 1000));
  const [maxPlayers, setMaxPlayers] = useState(gameState.maxPlayers || 8);

  // Sync internal state with gameState changes for real-time updates
  useEffect(() => {
    setTopics(gameState.topics || [gameState.currentTopic || ""]);
  }, [gameState.topics, gameState.currentTopic]);



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



  return (
    <div className="bg-white/10 rounded-2xl shadow-lg p-4 border border-white/20 max-w-xl w-full mx-auto space-y-4">
      {/* Game Topics Section */}
      <section>
        <h3 className="text-lg font-semibold text-text-main mb-2">Game Topics</h3>
        <div className="flex flex-wrap gap-2 mb-2">
          {topics.map((topic, index) => (
            <span key={index} className="flex items-center bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-sm font-medium">
              {topic}
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => handleRemoveTopic(index)}
                  className="ml-2 text-indigo-300 hover:text-rose-500 focus:outline-none"
                  aria-label={`Remove topic ${topic}`}
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
        <div className="relative">
          <div className="flex gap-2 items-center min-w-0">
            <input
            type="text"
            value={newTopic}
            onChange={e => setNewTopic(e.target.value)}
            onKeyDown={handleNewTopicKeyDown}
            placeholder="Add a topic..."
            disabled={isReadOnly}
            className={`flex-1 min-w-0 px-3 py-2 text-sm border rounded-md placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary ${
              isReadOnly 
                ? "bg-white/5 border-white/10 text-text-secondary cursor-not-allowed" 
                : "bg-white/10 border-white/20 text-text-main"
            }`}
            />
            {!isReadOnly && (
              <button
                type="button"
                onClick={handleAddTopicChip}
                className="hidden sm:inline-flex px-3 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                + Add
              </button>
            )}
          </div>
          
          {/* Topic validation error message */}
          {!isReadOnly && validTopics.length === 0 && (
            <p className="text-yellow-300 text-sm mt-2">
              Please add at least one topic to start the game.
            </p>
          )}

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
      </section>
    </div>
  );
}
