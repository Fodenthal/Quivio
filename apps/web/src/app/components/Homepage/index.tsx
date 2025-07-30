"use client";

import React, { useState } from "react";
import { CreateRoomPanel } from "./CreateRoomPanel";
import { JoinRoomPanel } from "./JoinRoomPanel";
import { ActiveRoomsList } from "../ActiveRoomsList";
import { TrendingTopics } from "../TrendingTopics";
import { UserDisplayName } from "../UserDisplayName";
import { ThemeToggle } from "../ThemeToggle";
import { useDisplayName } from "../../../contexts/DisplayNameContext";

export interface HomepageProps {
  onJoinRoom: (playerName: string, gamePin: string) => void;
  onCreateRoom: (roomName: string, hostName: string, topics: string[], difficulty: number, isPrivate: boolean) => void;
}

export const Homepage: React.FC<HomepageProps> = ({ onJoinRoom, onCreateRoom }) => {
  const { displayName } = useDisplayName();
  const [roomName, setRoomName] = useState("");
  const [gamePin, setGamePin] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

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
      await onCreateRoom(roomName, displayName, [], 2, isPrivate); // Default difficulty: medium
    } catch (error: unknown) {
      setCreateError(error instanceof Error ? error.message : "Failed to create room");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    setIsJoining(true);
    try {
      await onJoinRoom(displayName, gamePin);
    } catch (error: unknown) {
      setJoinError(error instanceof Error ? error.message : "Failed to join room");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header with Cursor-style design */}
      <header className="header-cursor">
        <div className="container-cursor">
          <div className="flex items-center justify-between h-20">
            <div className="flex flex-col">
              <h1 className="heading-cursor-lg text-light-accent-primary dark:text-dark-accent-primary">Quivio</h1>
              <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm font-medium">Limitless Trivia</p>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <UserDisplayName />
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content with equal spacing */}
      <main className="container-cursor py-12 lg:py-16">
        <div className="space-y-12">
          {/* Main Row: Active Rooms (left) and Create/Join Room panels (right) */}
          <div className="grid lg:grid-cols-3 gap-8 h-[500px]">
            {/* Left: Active Rooms - takes 2/3 space */}
            <div className="lg:col-span-2 h-full">
              <ActiveRoomsList onJoinRoom={onJoinRoom} />
            </div>
            {/* Right: Create and Join Room panels stacked - 1/3 width */}
            <div className="h-full flex flex-col gap-6">
              {/* Create Room Panel */}
              <div className="flex-1">
                <CreateRoomPanel
                  roomName={roomName}
                  onRoomNameChange={handleRoomNameChange}
                  isPrivate={isPrivate}
                  onPrivateToggle={setIsPrivate}
                  onCreateRoom={handleCreateRoom}
                  isCreating={isCreating}
                  error={createError}
                  displayName={displayName}
                />
              </div>
              {/* Join Room Panel */}
              <div className="flex-1">
                <JoinRoomPanel
                  displayName={displayName}
                  gamePin={gamePin}
                  onGamePinChange={handleGamePinChange}
                  onJoinRoom={handleJoinRoom}
                  isJoining={isJoining}
                  error={joinError}
                />
              </div>
            </div>
          </div>
          
          {/* Trending Topics, full width with much more spacing */}
          <div className="pt-52">
            <TrendingTopics />
          </div>
        </div>
      </main>
    </div>
  );
}; 