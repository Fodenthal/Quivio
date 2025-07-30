import React from "react";

export interface JoinRoomPanelProps {
  gamePin: string;
  onGamePinChange: (pin: string) => void;
  onJoinRoom: () => void;
  isJoining: boolean;
  error?: string | null;
  displayName: string;
}

/**
 * Join room panel for entering existing games
 * Features PIN input with clean design
 */
export const JoinRoomPanel: React.FC<JoinRoomPanelProps> = ({
  gamePin,
  onGamePinChange,
  onJoinRoom,
  isJoining,
  error,
  displayName,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isJoining && displayName.trim() && gamePin.trim()) {
      onJoinRoom();
    }
  };

  const isFormValid = displayName.trim() && gamePin.trim();

  return (
    <div className="card p-6 h-full flex flex-col animate-cursor-in">
      <div className="text-center mb-6">
        <h2 className="heading-cursor text-xl">
          Join a room
        </h2>
        <p className="text-cursor-secondary text-sm mt-2">
          Enter a room code to join an existing game
        </p>
      </div>
      
      <div className="flex-grow flex flex-col justify-center space-y-6">
        {/* Game PIN Input */}
        <div className="space-y-2">
          <label htmlFor="game-pin" className="text-sm font-medium text-text-secondary">
            Room Code
          </label>
          <input
            id="game-pin"
            type="text"
            value={gamePin}
            onChange={(e) => onGamePinChange(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder="Enter room code..."
            className="input"
            maxLength={6}
          />
        </div>
        
        {/* Join Room Button */}
        <button
          onClick={onJoinRoom}
          disabled={isJoining || !isFormValid}
          className="btn-primary w-full py-3 text-base font-semibold"
        >
          {isJoining ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Joining...
            </div>
          ) : (
            "Join Room"
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