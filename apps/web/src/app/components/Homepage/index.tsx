"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateRoomPanel } from "./CreateRoomPanel";
import { JoinRoomPanel } from "./JoinRoomPanel";
import { ActiveRoomsList } from "../ActiveRoomsList";
// Removed TrendingTopics in favor of a larger Active Rooms area
import { UserDropdown } from "../UserDropdown";
import { useDisplayName } from "../../../contexts/DisplayNameContext";
import { InfoPanel } from "@/app/components/Homepage/InfoPanel";
import { AnnouncementsPanel } from "@/app/components/Homepage/AnnouncementsPanel";
import { QuivioLogo } from "../QuivioLogo";
import { CreateQuestionsCallout } from "./CreateQuestionsCallout";

export interface HomepageProps {
  onJoinRoom: (playerName: string, gamePin: string) => void;
  onCreateRoom: (roomName: string, hostName: string, topics: string[], difficulty: number, isPrivate: boolean) => void;
}

export const Homepage: React.FC<HomepageProps> = ({ onJoinRoom, onCreateRoom }) => {
  const router = useRouter();
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

  const handleNavigateToQuestions = () => {
    router.push("/questions");
  };

  return (
    <div className="min-h-dvh safe-bottom">
      {/* Header styled like GameLayout, with Quivio and UserDisplayName */}
      <header className="bg-white/5 backdrop-blur-xl shadow-glass border-b border-white/10 safe-top relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-1 sm:gap-2">
              <QuivioLogo 
                size={60} 
                className="text-indigo-400 translate-y-[1px] sm:translate-y-[2px] sm:w-20 sm:h-20" 
              />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-indigo-400">
                Quivio
              </h1>
            </div>
            <UserDropdown />
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="w-full pt-4 pb-12 sm:pt-6 lg:py-12">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-3">
          {/* Info Panel - Shows first on mobile/tablet, moves to right sidebar on desktop */}
          <div className="lg:order-2 lg:flex lg:flex-col lg:gap-3">
            <InfoPanel />
            <div className="hidden lg:flex lg:flex-col lg:gap-3">
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
              <CreateQuestionsCallout onCreateClick={handleNavigateToQuestions} />
              <AnnouncementsPanel />
            </div>
          </div>
          
          {/* Active Rooms - Shows after info panel on mobile/tablet, left side on desktop */}
          <div className="lg:order-1 lg:col-span-2">
            <ActiveRoomsList onJoinRoom={onJoinRoom} className="min-h-[60dvh] md:min-h-[70dvh]" />
          </div>
          
          {/* Mobile/Tablet panels - Shows after active rooms on mobile/tablet, hidden on desktop */}
          <div className="flex flex-col gap-3 lg:hidden">
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
            <CreateQuestionsCallout onCreateClick={handleNavigateToQuestions} />
            <AnnouncementsPanel />
          </div>
        </div>
      </main>
    </div>
  );
};
