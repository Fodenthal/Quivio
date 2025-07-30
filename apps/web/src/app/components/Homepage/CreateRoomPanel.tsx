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
    <div className="card p-6 h-full flex flex-col animate-cursor-in">
      <div className="text-center mb-6">
        <h2 className="heading-cursor text-xl">
          Start a new room
        </h2>
        <p className="text-cursor-secondary text-sm mt-2">
          Create a trivia room and invite friends
        </p>
      </div>
      
      <div className="flex-grow flex flex-col justify-center space-y-6">
        {/* Room Name Input */}
        <div className="space-y-2">
          <label htmlFor="room-name" className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
            Room Name
          </label>
          <input
            id="room-name"
            type="text"
            value={roomName}
            onChange={(e) => onRoomNameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter room name..."
            className="input"
          />
        </div>
        
        {/* Public/Private Toggle */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
            Room Type
          </label>
          <div className="flex items-center gap-2 p-1 bg-light-background-tertiary dark:bg-dark-background-tertiary rounded-lg border border-light-border-primary dark:border-dark-border-primary">
            <button
              onClick={() => onPrivateToggle(false)}
              className={`flex-1 px-4 py-3 rounded-md font-semibold transition-all duration-200 ${
                !isPrivate
                  ? "bg-light-accent-primary dark:bg-dark-accent-primary text-white shadow-light dark:shadow-cursor transform scale-105 ring-2 ring-light-accent-primary/30 dark:ring-dark-accent-primary/30"
                  : "text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary hover:bg-light-background-hover dark:hover:bg-dark-background-hover"
              }`}
            >
              Public
            </button>
            <button
              onClick={() => onPrivateToggle(true)}
              className={`flex-1 px-4 py-3 rounded-md font-semibold transition-all duration-200 ${
                isPrivate
                  ? "bg-light-accent-primary dark:bg-dark-accent-primary text-white shadow-light dark:shadow-cursor transform scale-105 ring-2 ring-light-accent-primary/30 dark:ring-dark-accent-primary/30"
                  : "text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary hover:bg-light-background-hover dark:hover:bg-dark-background-hover"
              }`}
            >
              Private
            </button>
          </div>
          <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary text-center">
            {!isPrivate 
              ? "Anyone can join with the room code" 
              : "Only invited players can join"
            }
          </p>
        </div>
        
        {/* Create Room Button */}
        <button
          onClick={onCreateRoom}
          disabled={isCreating || !roomName.trim() || !displayName.trim()}
          className="btn-primary w-full py-3 text-base font-semibold"
        >
          {isCreating ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Creating...
            </div>
          ) : (
            "Create Room"
          )}
        </button>
        
        {/* Error Display */}
        {error && (
          <div className="p-4 bg-error/10 border border-error/20 rounded-lg animate-cursor-in">
            <p className="text-error text-sm text-center">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}; 