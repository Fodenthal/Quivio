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
    <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-glass p-4 border border-white/20 hover:border-white/30 transition-all duration-300 h-full flex flex-col">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-text-main">
          Join a room
        </h2>
      </div>
      <div className="flex-grow flex flex-col justify-center space-y-4">
        {/* Game PIN Input */}
        <div className="space-y-2">
          <input
            type="text"
            value={gamePin}
            onChange={(e) => onGamePinChange(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder="Room code"
            className="w-full px-3 py-2 text-center text-sm bg-white/20 border border-white/30 rounded-lg text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 focus:border-green-500/50 transition-all duration-300 font-mono tracking-wider"
          />
        </div>
        {/* Join Room Button */}
        <button
          onClick={onJoinRoom}
          disabled={isJoining || !isFormValid}
          className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-opacity-90 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isJoining ? "Joining..." : "Join Room"}
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