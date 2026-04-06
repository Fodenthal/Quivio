"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { ClassicsTrackSlug } from "@shared/index";
import { CreateRoomPanel } from "./CreateRoomPanel";
import { JoinRoomPanel } from "./JoinRoomPanel";
import { ActiveRoomsList } from "../ActiveRoomsList";
import { UserDropdown } from "../UserDropdown";
import { useDisplayName } from "../../../contexts/DisplayNameContext";
import { InfoPanel } from "@/app/components/Homepage/InfoPanel";
import { QuivioLogo } from "../QuivioLogo";
import { classicsTracks, getTrackBySlug } from "@/content/classics/tracks";

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
  const [selectedTrackSlug, setSelectedTrackSlug] = useState<ClassicsTrackSlug>("roman-history");

  const selectedTrack = getTrackBySlug(selectedTrackSlug) ?? classicsTracks[0];

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
      await onCreateRoom(roomName, displayName, [selectedTrack.title], 2, isPrivate);
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
      <main className="w-full pt-4 pb-12 sm:pt-6 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
            <div className="card p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-200">Classics, focused</p>
              <h2 className="mt-3 text-4xl font-bold text-white md:text-5xl">
                Learn Greek and Roman history, then compete on it.
              </h2>
              <p className="mt-4 max-w-2xl text-lg text-text-secondary">
                Quivio now has two clear paths: guided lessons that build real knowledge and live quiz rooms that let you test that knowledge alone or against other players.
              </p>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => router.push("/learn")}
                  className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5 text-left transition-colors hover:bg-amber-300/15"
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200">Learn Mode</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Courses and lessons</h3>
                  <p className="mt-2 text-sm text-text-secondary">
                    Work through short lessons on history, mythology, famous figures, and vocabulary.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => document.getElementById("quiz-mode")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition-colors hover:bg-white/10"
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-200">Quiz Mode</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Live rooms and solo practice</h3>
                  <p className="mt-2 text-sm text-text-secondary">
                    Create a room for one Classics track, play privately or publicly, and compete in real time.
                  </p>
                </button>
              </div>
              <div className="mt-6">
                <InfoPanel />
              </div>
            </div>

            <div className="card p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">Topic lineup</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {classicsTracks.map((track) => {
                  const isSelected = track.slug === selectedTrack.slug;

                  return (
                    <button
                      key={track.slug}
                      type="button"
                      onClick={() => setSelectedTrackSlug(track.slug)}
                      className={`rounded-2xl border p-4 text-left transition-colors ${
                        isSelected
                          ? "border-amber-300/30 bg-amber-300/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <h3 className="text-lg font-semibold text-white">{track.title}</h3>
                      <p className="mt-2 text-sm text-text-secondary">{track.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {track.subtopics.slice(0, 3).map((subtopic) => (
                          <span key={subtopic} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                            {subtopic}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <div id="quiz-mode" className="mt-6 flex flex-col lg:grid lg:grid-cols-3 gap-3 lg:gap-6">
            <div className="lg:order-2 lg:flex lg:flex-col lg:gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">Selected quiz focus</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{selectedTrack.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{selectedTrack.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedTrack.quizTopics.map((topic) => (
                    <span key={topic} className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

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
                  tracks={classicsTracks}
                  selectedTrackSlug={selectedTrack.slug}
                  onSelectTrack={setSelectedTrackSlug}
                />
                <JoinRoomPanel
                  displayName={displayName}
                  gamePin={gamePin}
                  onGamePinChange={handleGamePinChange}
                  onJoinRoom={handleJoinRoom}
                  isJoining={isJoining}
                  error={joinError}
                />
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-lg font-semibold text-white">How to use the new flow</h3>
                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-text-secondary">
                    <li>Pick a Classics track.</li>
                    <li>Create a room for that topic or join an existing one.</li>
                    <li>Use Learn Mode to build up knowledge between rounds.</li>
                  </ol>
                  <button
                    type="button"
                    onClick={() => router.push("/learn")}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400"
                  >
                    Open Learn Mode
                  </button>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-lg font-semibold text-white">Need a solo run?</h3>
                  <p className="mt-2 text-sm text-text-secondary">
                    Create a private room and start immediately. The current room system already supports one-player practice.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:order-1 lg:col-span-2">
              <ActiveRoomsList onJoinRoom={onJoinRoom} className="min-h-[60dvh] md:min-h-[70dvh]" />
            </div>
            
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
                tracks={classicsTracks}
                selectedTrackSlug={selectedTrack.slug}
                onSelectTrack={setSelectedTrackSlug}
              />
              <JoinRoomPanel
                displayName={displayName}
                gamePin={gamePin}
                onGamePinChange={handleGamePinChange}
                onJoinRoom={handleJoinRoom}
                isJoining={isJoining}
                error={joinError}
              />
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h3 className="text-lg font-semibold text-white">Need a lesson first?</h3>
                <p className="mt-2 text-sm text-text-secondary">
                  Jump into Learn Mode for short topic sequences before you enter a room.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/learn")}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400"
                >
                  Start learning
                </button>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h3 className="text-lg font-semibold text-white">Community question uploads</h3>
                <p className="mt-2 text-sm text-text-secondary">
                  The old question upload tools still exist while the Classics curriculum is being curated.
                </p>
                <button
                  type="button"
                  onClick={handleNavigateToQuestions}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"
                >
                  Open question tools
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
