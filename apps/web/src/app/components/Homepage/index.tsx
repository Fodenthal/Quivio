"use client";

import { useState } from "react";
import { TrendingTopics } from "../TrendingTopics";
import { ActiveRoomsList } from "../ActiveRoomsList";
import { CreateRoomPanel } from "./CreateRoomPanel";
import { JoinRoomPanel } from "./JoinRoomPanel";

export interface HomepageProps {
  onJoinRoom: (playerName: string, gamePin: string) => void;
  onCreateRoom: (topic: string, difficulty: number, isPrivate: boolean) => void;
}

/**
 * Homepage component with JKLM-inspired layout
 * Handles room creation and joining before game starts
 */
export const Homepage: React.FC<HomepageProps> = ({ onJoinRoom, onCreateRoom }) => {
  const [playerName, setPlayerName] = useState("");
  const [gamePin, setGamePin] = useState("");
  const [roomTopic, setRoomTopic] = useState("");
  const [difficulty, setDifficulty] = useState(5); // Default to medium
  const [isPrivate, setIsPrivate] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleJoinRoom = async () => {
    // Clear previous errors
    setJoinError(null);
    
    // Client-side validation
    if (!playerName.trim()) {
      setJoinError("Please enter your name");
      return;
    }
    if (!gamePin.trim()) {
      setJoinError("Please enter a game pin");
      return;
    }
    
    // Validate game pin format
    if (!/^[A-Z0-9]{5}$/.test(gamePin.trim())) {
      setJoinError("Game pin must be 5 alphanumeric characters (A-Z, 0-9)");
      return;
    }

    setIsJoining(true);
    try {
      await onJoinRoom(playerName.trim(), gamePin.trim().toUpperCase());
      // If successful, component will unmount as user navigates to game
    } catch (error) {
      console.error("Failed to join room:", error);
      
      // Parse error message for user-friendly display
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes("Room not found")) {
        setJoinError(`Room "${gamePin.trim().toUpperCase()}" not found. Please check the game pin.`);
      } else if (errorMessage.includes("Invalid game pin format")) {
        setJoinError("Invalid game pin format. Must be 5 alphanumeric characters.");
      } else if (errorMessage.includes("Server error")) {
        setJoinError("Server error. Please try again in a moment.");
      } else {
        setJoinError("Failed to join room. Please try again.");
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateRoom = async () => {
    // Clear previous errors
    setCreateError(null);
    
    if (!roomTopic.trim()) {
      setCreateError("Please enter a room topic");
      return;
    }

    setIsCreating(true);
    try {
      await onCreateRoom(roomTopic.trim(), difficulty, isPrivate);
      // If successful, component will unmount as user navigates to game
    } catch (error) {
      console.error("Failed to create room:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setCreateError(`Failed to create room: ${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Clear errors when inputs change
  const handlePlayerNameChange = (name: string) => {
    setPlayerName(name);
    if (joinError) setJoinError(null);
  };

  const handleGamePinChange = (pin: string) => {
    setGamePin(pin);
    if (joinError) setJoinError(null);
  };

  const handleRoomTopicChange = (topic: string) => {
    setRoomTopic(topic);
    if (createError) setCreateError(null);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl shadow-glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <h1 className="text-3xl font-bold text-primary">PopReplay</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Interactive Elements (70-75% width) */}
          <div className="flex-1 lg:flex-[3] space-y-8">
            {/* Hero Section - Two Panel Layout */}
            <div className="flex flex-col lg:flex-row items-start gap-8 w-full">
              <div className="flex-1 w-full">
                <CreateRoomPanel
                  roomTopic={roomTopic}
                  onRoomTopicChange={handleRoomTopicChange}
                  difficulty={difficulty}
                  onDifficultyChange={setDifficulty}
                  isPrivate={isPrivate}
                  onPrivateToggle={setIsPrivate}
                  onCreateRoom={handleCreateRoom}
                  isCreating={isCreating}
                  error={createError}
                />
              </div>
              <div className="flex-1 w-full">
                <JoinRoomPanel
                  playerName={playerName}
                  onPlayerNameChange={handlePlayerNameChange}
                  gamePin={gamePin}
                  onGamePinChange={handleGamePinChange}
                  onJoinRoom={handleJoinRoom}
                  isJoining={isJoining}
                  error={joinError}
                />
              </div>
            </div>

            {/* Active Rooms - Below Hero Section */}
            <div className="h-[400px] lg:h-[500px]">
              <ActiveRoomsList onJoinRoom={onJoinRoom} />
            </div>
          </div>
          
          {/* Right Column - Trending Topics (25-30% width) */}
          <div className="lg:flex-1 lg:max-w-sm">
            <div className="h-[400px] lg:h-[1032px]">
              <TrendingTopics />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}; 