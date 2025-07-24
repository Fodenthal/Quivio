"use client";

import React, { useEffect, useState } from "react";
import { CreateRoomPanel } from "./CreateRoomPanel";
import { JoinRoomPanel } from "./JoinRoomPanel";
import { ActiveRoomsList } from "../ActiveRoomsList";
import { TrendingTopics } from "../TrendingTopics";

export interface HomepageProps {
  onJoinRoom: (playerName: string, gamePin: string) => void;
  onCreateRoom: (roomName: string, hostName: string, topics: string[], difficulty: number, isPrivate: boolean) => void;
}

export const Homepage: React.FC<HomepageProps> = ({ onJoinRoom, onCreateRoom }) => {
  const [roomName, setRoomName] = useState("");
  const [gamePin, setGamePin] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [difficulty, setDifficulty] = useState(2); // 2 = medium

  // Sync displayName with localStorage
  useEffect(() => {
    const stored = localStorage.getItem("quivioDisplayName");
    if (stored) setDisplayName(stored);
    const handleStorage = () => {
      const updated = localStorage.getItem("quivioDisplayName");
      setDisplayName(updated || "");
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Always use 'Guest' if displayName is empty
  const safeDisplayName = displayName && displayName.trim() ? displayName : "Guest";

  const handleGamePinChange = (pin: string) => {
    setGamePin(pin);
    if (joinError) setJoinError(null);
  };

  const handleRoomNameChange = (name: string) => {
    setRoomName(name);
    if (createError) setCreateError(null);
  };

  const handleCreateRoom = async () => {
    setIsCreating(true);
    try {
      await onCreateRoom(roomName, safeDisplayName, [], difficulty, isPrivate);
    } catch (error: any) {
      setCreateError(error?.message || "Failed to create room");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    setIsJoining(true);
    try {
      await onJoinRoom(safeDisplayName, gamePin);
    } catch (error: any) {
      setJoinError(error?.message || "Failed to join room");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl shadow-glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <h1 className="text-3xl font-bold text-primary">Quivio</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col gap-8">
          {/* Main Row: Create Room, Join Room, Active Rooms */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Create Room */}
            <div className="flex-1 w-full min-h-[500px] flex">
              <CreateRoomPanel
                roomName={roomName}
                onRoomNameChange={handleRoomNameChange}
                isPrivate={isPrivate}
                onPrivateToggle={setIsPrivate}
                onCreateRoom={handleCreateRoom}
                isCreating={isCreating}
                error={createError}
                displayName={safeDisplayName}
              />
            </div>
            {/* Middle: Join Room */}
            <div className="flex-1 w-full min-h-[500px] flex">
              <JoinRoomPanel
                displayName={safeDisplayName}
                gamePin={gamePin}
                onGamePinChange={handleGamePinChange}
                onJoinRoom={handleJoinRoom}
                isJoining={isJoining}
                error={joinError}
              />
            </div>
            {/* Right: Active Rooms */}
            <div className="flex-1 w-full min-h-[500px] flex">
              <ActiveRoomsList onJoinRoom={onJoinRoom} />
            </div>
          </div>
          {/* Bottom: Trending Topics, full width */}
          <div>
            <TrendingTopics />
          </div>
        </div>
      </main>
    </div>
  );
}; 