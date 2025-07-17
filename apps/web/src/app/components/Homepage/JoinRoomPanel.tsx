import React from "react";

export interface JoinRoomPanelProps {
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  gamePin: string;
  onGamePinChange: (pin: string) => void;
  onJoinRoom: () => void;
  isJoining: boolean;
}

/**
 * Join room panel for entering existing games
 * Features name and PIN input with clean design
 */
export const JoinRoomPanel: React.FC<JoinRoomPanelProps> = ({
  playerName,
  onPlayerNameChange,
  gamePin,
  onGamePinChange,
  onJoinRoom,
  isJoining,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isJoining && playerName.trim() && gamePin.trim()) {
      onJoinRoom();
    }
  };

  const isFormValid = playerName.trim() && gamePin.trim();

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-glass p-6 lg:p-8 border border-white/20 hover:border-white/30 transition-all duration-300 h-full min-h-[500px] flex flex-col">
      <div className="text-center mb-6">
        <h2 className="text-2xl lg:text-3xl font-bold text-text-main mb-2">
          Join a private room
        </h2>
        <p className="text-text-secondary text-lg">
          Enter a room code to join
        </p>
      </div>
      
      <div className="flex-grow flex flex-col justify-center space-y-6">
        {/* Player Name Input */}
        <div className="space-y-2">
          <label htmlFor="player-name" className="block text-sm font-medium text-text-main">
            Your Name
          </label>
          <input
            id="player-name"
            type="text"
            value={playerName}
            onChange={(e) => onPlayerNameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your display name"
            maxLength={16}
            className="w-full px-4 py-3 lg:py-4 text-center text-base lg:text-lg bg-white/20 border border-white/30 rounded-lg text-text-main placeholder-text-secondary focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-50 focus:border-green-500/50 transition-all duration-300"
          />
        </div>
        
        {/* Game PIN Input */}
        <div className="space-y-2">
          <label htmlFor="game-pin" className="block text-sm font-medium text-text-main">
            Room Code
          </label>
          <input
            id="game-pin"
            type="text"
            value={gamePin}
            onChange={(e) => onGamePinChange(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder="ABCD1234"
            className="w-full px-4 py-3 lg:py-4 text-center text-base lg:text-lg bg-white/20 border border-white/30 rounded-lg text-text-main placeholder-text-secondary focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-50 focus:border-green-500/50 transition-all duration-300 font-mono tracking-wider"
          />
        </div>
        
        {/* Join Room Button */}
        <button
          onClick={onJoinRoom}
          disabled={isJoining || !isFormValid}
          className="w-full px-6 py-3 lg:py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold text-lg lg:text-xl rounded-lg hover:from-green-700 hover:to-green-800 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
        >
          {isJoining ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Joining Room...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>Join Room</span>
            </span>
          )}
        </button>
      </div>
      
      {/* Helper text */}
      <div className="mt-auto pt-4 text-center">
        <p className="text-xs text-text-secondary">
          Room codes are case-sensitive.
        </p>
      </div>
    </div>
  );
}; 