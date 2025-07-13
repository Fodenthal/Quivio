"use client";

import { useState } from "react";
import { TrendingTopics } from "../TrendingTopics";
import { GamePins } from "../GamePins";
import { HeroSection } from "./HeroSection";
import { CreateRoomPanel } from "./CreateRoomPanel";
import { JoinRoomPanel } from "./JoinRoomPanel";

export interface HomepageProps {
  onJoinRoom: (playerName: string, gamePin: string) => void;
  onCreateRoom: (topic: string, isPrivate: boolean) => void;
}

/**
 * Homepage component with JKLM-inspired layout
 * Handles room creation and joining before game starts
 */
export const Homepage: React.FC<HomepageProps> = ({ onJoinRoom, onCreateRoom }) => {
  const [playerName, setPlayerName] = useState("");
  const [gamePin, setGamePin] = useState("");
  const [roomTopic, setRoomTopic] = useState("");
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
      await onCreateRoom(roomTopic.trim(), isPrivate);
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
        {/* Hero Section - Two Panel Layout */}
        <HeroSection>
          <CreateRoomPanel
            roomTopic={roomTopic}
            onRoomTopicChange={setRoomTopic}
            isPrivate={isPrivate}
            onPrivateToggle={setIsPrivate}
            onCreateRoom={handleCreateRoom}
            isCreating={isCreating}
          />
          <JoinRoomPanel
            playerName={playerName}
            onPlayerNameChange={setPlayerName}
            gamePin={gamePin}
            onGamePinChange={setGamePin}
            onJoinRoom={handleJoinRoom}
            isJoining={isJoining}
          />
        </HeroSection>

        {/* Bottom Section - Active Rooms and Trending Topics */}
        <div className="mt-16 flex flex-col lg:flex-row gap-8">
          {/* Active Rooms - Left */}
          <div className="flex-1">
            <div className="h-[400px] lg:h-[500px]">
              <GamePins />
            </div>
          </div>
          
          {/* Trending Topics - Right */}
          <div className="flex-1">
            <div className="h-[400px] lg:h-[500px]">
              <TrendingTopics />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}; 