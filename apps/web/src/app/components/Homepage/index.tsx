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
  const valueProps = [
    {
      title: "Play in seconds",
      body: "Join a public room or start your own with instant PINs and no setup.",
    },
    {
      title: "Any topic, any difficulty",
      body: "Pick from trending topics or let AI craft fresh questions on the fly.",
    },
    {
      title: "Built for friends & teams",
      body: "Chat, compete, and keep the vibe light with fast rounds and clear scoring.",
    },
  ];

  const faqs = [
    {
      q: "Is Quivio free?",
      a: "Yes. You can create and join public games for free. Private rooms are also included.",
    },
    {
      q: "Do I need an account?",
      a: "No. You can play as a guest. Create an account if you want to save stats and preferences.",
    },
    {
      q: "How many players can join?",
      a: "Most rooms support up to 16 players by default. Hosts can tune max players in room settings.",
    },
    {
      q: "What about safety and content?",
      a: "We filter prompts, enforce community guidelines, and moderate reports to keep games clean.",
    },
  ];

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <section className="mb-8 sm:mb-10">
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 md:p-8 shadow-glass">
              <div className="grid lg:grid-cols-2 gap-6 items-start">
                <div className="space-y-3">
                  <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">What is Quivio?</p>
                  <h2 className="text-3xl font-bold text-white">Trivia on anything, with anyone.</h2>
                  <p className="text-text-secondary text-lg">
                    Launch a game in seconds, pick topics you love, and let our AI keep questions fresh. Play casually with friends or run a full trivia night without the hosting headache.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-sm">Live multiplayer</span>
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-sm">AI questions</span>
                    <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 text-sm">Instant lobby</span>
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  {valueProps.map((item) => (
                    <div key={item.title} className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
                      <p className="text-sm text-text-secondary">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8 sm:mb-10 grid lg:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-lg p-5 space-y-2">
              <h3 className="text-lg font-semibold text-white">How it works</h3>
              <ol className="list-decimal list-inside text-text-secondary space-y-1 text-sm">
                <li>Create or join a room with a PIN.</li>
                <li>Pick topics and difficulty.</li>
                <li>Play fast rounds, chat, and crown a winner.</li>
              </ol>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-5 space-y-2">
              <h3 className="text-lg font-semibold text-white">Why people stay</h3>
              <ul className="list-disc list-inside text-text-secondary space-y-1 text-sm">
                <li>Fresh AI-written questions.</li>
                <li>Responsive, mobile-friendly UI.</li>
                <li>Moderation + community guidelines built in.</li>
              </ul>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-5 space-y-2">
              <h3 className="text-lg font-semibold text-white">Explore more</h3>
              <p className="text-text-secondary text-sm">
                New to Quivio? Read our blog for hosting tips and trivia strategies, or jump into the FAQ below.
              </p>
              <button
                onClick={() => router.push("/blog")}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 transition-colors text-sm"
              >
                Visit the blog →
              </button>
            </div>
          </section>

          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-3 lg:gap-6">
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
        </div>

          <section className="mt-8 sm:mt-12 bg-white/5 border border-white/10 rounded-lg p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-2xl font-semibold text-white mb-3">FAQ</h3>
                <div className="space-y-3">
                  {faqs.map((item) => (
                    <div key={item.q}>
                      <p className="font-semibold text-indigo-200">{item.q}</p>
                      <p className="text-text-secondary text-sm">{item.a}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-5 space-y-3">
                <h4 className="text-lg font-semibold text-white">Looking for more tips?</h4>
                <p className="text-text-secondary text-sm">
                  Check out our latest hosting guides and trivia strategy articles to keep your games fresh.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => router.push("/blog/art-of-hosting-trivia")}
                    className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm text-white transition-colors"
                  >
                    Hosting tips
                  </button>
                  <button
                    onClick={() => router.push("/blog/improve-trivia-skills")}
                    className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm text-white transition-colors"
                  >
                    Improve skills
                  </button>
                  <button
                    onClick={() => router.push("/community-guidelines")}
                    className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm text-white transition-colors"
                  >
                    Community rules
                  </button>
                </div>
              </div>
            </div>
          </section>
      </main>
    </div>
  );
};
