import React from "react";

export interface CreateRoomPanelProps {
  roomTopic: string;
  onRoomTopicChange: (topic: string) => void;
  isPrivate: boolean;
  onPrivateToggle: (isPrivate: boolean) => void;
  onCreateRoom: () => void;
  isCreating: boolean;
}

/**
 * Primary monetization component for room creation
 * Features topic input and public/private toggle
 */
export const CreateRoomPanel: React.FC<CreateRoomPanelProps> = ({
  roomTopic,
  onRoomTopicChange,
  isPrivate,
  onPrivateToggle,
  onCreateRoom,
  isCreating,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isCreating && roomTopic.trim()) {
      onCreateRoom();
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-glass p-6 lg:p-8 border border-white/20 hover:border-white/30 transition-all duration-300">
      <div className="text-center mb-6">
        <h2 className="text-2xl lg:text-3xl font-bold text-text-main mb-2">
          START A NEW ROOM
        </h2>
        <p className="text-text-secondary text-lg">
          Create your own trivia room and invite friends
        </p>
      </div>
      
      <div className="space-y-6">
        {/* Topic Input */}
        <div className="space-y-2">
          <label htmlFor="room-topic" className="block text-sm font-medium text-text-main">
            Quiz Topic
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
              <span>✨</span>
              <span>CREATE ROOM</span>
            </span>
          )}
        </button>
      </div>
      
      {/* Subtle premium hint */}
      <div className="mt-4 text-center">
        <p className="text-xs text-text-secondary">
          Premium features coming soon • Unlimited rooms • Custom themes
        </p>
      </div>
    </div>
  );
}; 