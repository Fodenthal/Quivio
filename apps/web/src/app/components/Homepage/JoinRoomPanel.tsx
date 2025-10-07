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
    <div className="bg-white/5 border border-white/10 rounded-lg p-3 h-full flex flex-col">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-slate-100">
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
            className="w-full px-3 py-2 text-center text-sm bg-white/5 border border-white/10 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 font-mono tracking-wider"
          />
        </div>
        {/* Join Room Button */}
        <button
          onClick={onJoinRoom}
          disabled={isJoining || !isFormValid}
          className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isJoining ? "Joining..." : "Join Room"}
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