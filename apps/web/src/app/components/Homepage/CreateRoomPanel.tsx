import React from "react";

export interface CreateRoomPanelProps {
  roomTopic: string;
  onRoomTopicChange: (topic: string) => void;
  difficulty: number; // 1-10 scale
  onDifficultyChange: (difficulty: number) => void;
  isPrivate: boolean;
  onPrivateToggle: (isPrivate: boolean) => void;
  onCreateRoom: () => void;
  isCreating: boolean;
  error?: string | null;
}

/**
 * Primary monetization component for room creation
 * Features topic input and public/private toggle
 */
export const CreateRoomPanel: React.FC<CreateRoomPanelProps> = ({
  roomTopic,
  onRoomTopicChange,
  difficulty,
  onDifficultyChange,
  isPrivate,
  onPrivateToggle,
  onCreateRoom,
  isCreating,
  error,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isCreating && roomTopic.trim()) {
      onCreateRoom();
    }
  };

  const getDifficultyLabel = (diff: number): string => {
    if (diff <= 2) return "Very Easy";
    if (diff <= 4) return "Easy";
    if (diff <= 6) return "Medium";
    if (diff <= 8) return "Hard";
    return "Expert";
  };

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-glass p-6 lg:p-8 border border-white/20 hover:border-white/30 transition-all duration-300 h-full min-h-[500px] flex flex-col">
      <div className="text-center mb-6">
        <h2 className="text-2xl lg:text-3xl font-bold text-text-main mb-2">
          Start a new room
        </h2>
        <p className="text-text-secondary text-lg">
          Create a room for you and your friends
        </p>
      </div>
      
      <div className="flex-grow flex flex-col justify-center space-y-6">
        {/* Topic Input */}
        <div className="space-y-2">
          <label htmlFor="room-topic" className="block text-sm font-medium text-text-main">
            Room Topic
          </label>
          <input
            id="room-topic"
            type="text"
            value={roomTopic}
            onChange={(e) => onRoomTopicChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Movies, Sports, History, Science..."
            className="w-full px-4 py-3 lg:py-4 text-center text-base lg:text-lg bg-white/20 border border-white/30 rounded-lg text-text-main placeholder-text-secondary focus:outline-none focus:ring-4 focus:ring-primary focus:ring-opacity-50 focus:border-primary/50 transition-all duration-300"
          />
        </div>

        {/* Difficulty Slider */}
        <div className="space-y-3">
          <label htmlFor="difficulty-slider" className="block text-sm font-medium text-text-main">
            Difficulty Level
          </label>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Generic</span>
              <span className="text-lg font-bold text-primary">{getDifficultyLabel(difficulty)}</span>
              <span className="text-sm text-text-secondary">Unique</span>
            </div>
            <div className="relative">
              <input
                id="difficulty-slider"
                type="range"
                min="1"
                max="10"
                value={difficulty}
                onChange={(e) => onDifficultyChange(parseInt(e.target.value))}
                className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer"
                disabled={isCreating}
                style={{
                  background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${(difficulty - 1) * 11.11}%, rgba(255,255,255,0.2) ${(difficulty - 1) * 11.11}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-text-secondary mt-1">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
                <span>6</span>
                <span>7</span>
                <span>8</span>
                <span>9</span>
                <span>10</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Public/Private Toggle */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-text-main">
            Room Visibility
          </label>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => onPrivateToggle(false)}
              className={`flex-1 px-3 lg:px-4 py-2 lg:py-3 rounded-lg font-semibold transition-all duration-300 ${
                !isPrivate
                  ? "bg-primary text-white shadow-lg ring-2 ring-primary/50"
                  : "bg-white/20 text-text-secondary hover:bg-white/30 hover:text-text-main"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <span>🌍</span>
                <span>Public</span>
              </span>
            </button>
            <button
              onClick={() => onPrivateToggle(true)}
              className={`flex-1 px-3 lg:px-4 py-2 lg:py-3 rounded-lg font-semibold transition-all duration-300 ${
                isPrivate
                  ? "bg-primary text-white shadow-lg ring-2 ring-primary/50"
                  : "bg-white/20 text-text-secondary hover:bg-white/30 hover:text-text-main"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <span>🔒</span>
                <span>Private</span>
              </span>
            </button>
          </div>
        </div>
        
        {/* Create Room Button */}
        <button
          onClick={onCreateRoom}
          disabled={isCreating || !roomTopic.trim()}
          className="w-full px-6 py-3 lg:py-4 bg-gradient-to-r from-primary to-primary/80 text-white font-bold text-lg lg:text-xl rounded-lg hover:from-primary/90 hover:to-primary/70 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
        >
          {isCreating ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Creating Room...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>Create Room</span>
            </span>
          )}
        </button>
        
        {/* Error Display */}
        {error && (
          <div className="mt-3 p-3 bg-red-500/20 border border-red-500/40 rounded-lg">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}
      </div>
      
      {/* Subtle premium hint */}
      <div className="mt-auto pt-4 text-center">
        <p className="text-xs text-text-secondary">
          Premium features coming soon
        </p>
      </div>
    </div>
  );
}; 