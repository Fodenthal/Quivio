"use client";

import React, { useState } from "react";
import { CreateRoomPanel } from "./CreateRoomPanel";
import { JoinRoomPanel } from "./JoinRoomPanel";
import { ActiveRoomsList } from "../ActiveRoomsList";
// Removed TrendingTopics in favor of a larger Active Rooms area
import { UserDisplayName } from "../UserDisplayName";
import { useDisplayName } from "../../../contexts/DisplayNameContext";
import { InfoPanel } from "@/app/components/Homepage/InfoPanel";
import { AnnouncementsPanel } from "@/app/components/Homepage/AnnouncementsPanel";

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
      {/* Header styled like GameLayout, with Quivio and UserDisplayName */}
      <header className="bg-white/5 backdrop-blur-xl shadow-glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <h1 className="text-3xl font-bold text-primary">Quivio</h1>
            <UserDisplayName />
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Active Rooms - 2/3 width with generous height */}
          <div className="lg:col-span-2">
            <ActiveRoomsList onJoinRoom={onJoinRoom} className="min-h-[75vh]" />
          </div>
          {/* Right: Stacked panels */}
          <div className="flex flex-col gap-4">
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
            <JoinRoomPanel
              displayName={displayName}
              gamePin={gamePin}
              onGamePinChange={handleGamePinChange}
              onJoinRoom={handleJoinRoom}
              isJoining={isJoining}
              error={joinError}
            />
            <InfoPanel />
            <AnnouncementsPanel />
          </div>
        </div>
      </main>
    </div>
  );
}; 