"use client";

import { useState } from "react";
import { TrendingTopics } from "../TrendingTopics";
import { GamePins } from "../GamePins";
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

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      alert("Please enter your name");
      return;
    }
    if (!gamePin.trim()) {
      alert("Please enter a game pin");
      return;
    }

    setIsJoining(true);
    try {
      await onJoinRoom(playerName.trim(), gamePin.trim());
    } catch (error) {
      console.error("Failed to join room:", error);
      alert("Failed to join room. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!roomTopic.trim()) {
      alert("Please enter a room topic");
      return;
    }

    setIsCreating(true);
    try {
      await onCreateRoom(roomTopic.trim(), difficulty, isPrivate);
    } catch (error) {
      console.error("Failed to create room:", error);
      alert("Failed to create room. Please try again.");
    } finally {
      setIsCreating(false);
    }
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
                  onRoomTopicChange={setRoomTopic}
                  difficulty={difficulty}
                  onDifficultyChange={setDifficulty}
                  isPrivate={isPrivate}
                  onPrivateToggle={setIsPrivate}
                  onCreateRoom={handleCreateRoom}
                  isCreating={isCreating}
                />
              </div>
              <div className="flex-1 w-full">
                <JoinRoomPanel
                  playerName={playerName}
                  onPlayerNameChange={setPlayerName}
                  gamePin={gamePin}
                  onGamePinChange={setGamePin}
                  onJoinRoom={handleJoinRoom}
                  isJoining={isJoining}
                />
              </div>
            </div>

            {/* Game Pins - Below Hero Section */}
            <div className="h-[400px] lg:h-[500px]">
              <GamePins />
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