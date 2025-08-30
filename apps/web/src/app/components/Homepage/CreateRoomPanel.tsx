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
    <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-glass p-4 border border-white/20 hover:border-white/30 transition-all duration-300 h-full flex flex-col">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-text-main">
          Start a new room
        </h2>
      </div>
      
      <div className="flex-grow flex flex-col justify-center space-y-4">
        {/* Room Name Input */}
        <div className="space-y-2">
          <input
            type="text"
            value={roomName}
            onChange={(e) => onRoomNameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Room name"
            className="w-full px-3 py-2 text-center text-sm bg-white/20 border border-white/30 rounded-lg text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:border-blue-500/50 transition-all duration-300"
          />
        </div>
        
        {/* Public/Private Toggle */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onPrivateToggle(false)}
            className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
              !isPrivate
                ? "bg-blue-600 text-white"
                : "bg-white/20 text-text-secondary hover:bg-white/30 hover:text-text-main"
            }`}
          >
            Public
          </button>
          <button
            onClick={() => onPrivateToggle(true)}
            className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
              isPrivate
                ? "bg-blue-600 text-white"
                : "bg-white/20 text-text-secondary hover:bg-white/30 hover:text-text-main"
            }`}
          >
            Private
          </button>
        </div>
        
        {/* Create Room Button */}
        <button
          onClick={onCreateRoom}
          disabled={isCreating || !roomName.trim() || !displayName.trim()}
          className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isCreating ? "Creating..." : "Create Room"}
        </button>
        
        {/* Error Display */}
        {error && (
          <div className="p-2 bg-red-500/20 border border-red-500/40 rounded-lg">
            <p className="text-red-400 text-xs text-center">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}; 