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
    <div className="bg-white/5 border border-white/10 rounded-lg p-3 h-full flex flex-col">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-slate-100">
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
            className="w-full px-3 py-2 text-center text-sm bg-white/5 border border-white/10 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
          />
        </div>
        
        {/* Public/Private Toggle */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onPrivateToggle(false)}
            className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
              !isPrivate
                ? "bg-indigo-600 text-white"
                : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-slate-100"
            }`}
          >
            Public
          </button>
          <button
            onClick={() => onPrivateToggle(true)}
            className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
              isPrivate
                ? "bg-indigo-600 text-white"
                : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-slate-100"
            }`}
          >
            Private
          </button>
        </div>
        
        {/* Create Room Button */}
        <button
          onClick={onCreateRoom}
          disabled={isCreating || !roomName.trim() || !displayName.trim()}
          className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isCreating ? "Creating..." : "Create Room"}
        </button>
        
        {/* Error Display */}
        {error && (
          <div className="p-2 bg-rose-500/20 border border-rose-500/40 rounded-lg">
            <p className="text-rose-400 text-xs text-center">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}; 