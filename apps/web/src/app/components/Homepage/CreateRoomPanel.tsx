import React from "react";

export interface CreateRoomPanelProps {
  roomName: string;
  onRoomNameChange: (name: string) => void;
  isPrivate: boolean;
  onPrivateToggle: (isPrivate: boolean) => void;
  onCreateRoom: () => void;
  isCreating: boolean;
  error?: string | null;
  displayName: string;
}

/**
 * Primary monetization component for room creation
 * Features room name input and public/private toggle
 */
export const CreateRoomPanel: React.FC<CreateRoomPanelProps> = ({
  roomName,
  onRoomNameChange,
  isPrivate,
  onPrivateToggle,
  onCreateRoom,
  isCreating,
  error,
  displayName,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isCreating && roomName.trim() && displayName.trim()) {
      onCreateRoom();
    }
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
        {/* Room Name Input */}
        <div className="space-y-2">
          <label htmlFor="room-name" className="block text-sm font-medium text-text-main">
            Room Name
          </label>
          <input
            id="room-name"
            type="text"
            value={roomName}
            onChange={(e) => onRoomNameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="My Awesome Trivia Room"
            className="w-full px-4 py-3 lg:py-4 text-center text-base lg:text-lg bg-white/20 border border-white/30 rounded-lg text-text-main placeholder-text-secondary focus:outline-none focus:ring-4 focus:ring-primary focus:ring-opacity-50 focus:border-primary/50 transition-all duration-300"
          />
          <p className="text-xs text-text-secondary text-center">
            You&apos;ll set topics and difficulty after creating the room
          </p>
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
          <p className="text-xs text-text-secondary text-center">
            {isPrivate 
              ? "Only players with the room code can join"
              : "Room will appear in the public rooms list"
            }
          </p>
        </div>
        
        {/* Create Room Button */}
        <button
          onClick={onCreateRoom}
          disabled={isCreating || !roomName.trim() || !displayName.trim()}
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