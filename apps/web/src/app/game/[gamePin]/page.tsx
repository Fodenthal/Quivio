"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useGameConnectionContext } from "@/contexts/GameConnectionContext";
import { ConnectionStatus } from "@/lib/gameClient";
import { GameLayout } from "../../components/GameLayout";
import { useDisplayName } from "@/contexts/DisplayNameContext";
import { GameSessionStorage } from "@/utils/gameSessionStorage";

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const gamePin = params.gamePin as string;
  
  const { 
    connectionStatus, 
    gameState,
    currentPlayerId,
    joinRoom,
    leaveRoom,
    startGame,
    submitGuess,
    setTopics,
    setDifficulty,
    setTargetScore,
    setRoundTime,
    setMaxPlayers,
    sendChatMessage,
    attemptReconnection
  } = useGameConnectionContext();

  const { displayName } = useDisplayName();

  // State for tracking auto-join process
  const [isAttemptingJoin, setIsAttemptingJoin] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [hasAttemptedJoin, setHasAttemptedJoin] = useState(false);

  // Extract player name from URL parameters or use stored display name
  const playerNameFromUrl = searchParams.get('player');

  // Auto-join logic - runs when page loads with disconnected state
  useEffect(() => {
    // Only attempt auto-join once per page load
    if (connectionStatus === ConnectionStatus.DISCONNECTED && !hasAttemptedJoin && !isAttemptingJoin) {
      setHasAttemptedJoin(true);
      setIsAttemptingJoin(true);
      setJoinError(null);

      const attemptAutoJoin = async () => {
        try {
          console.log(`🔄 Auto-join attempt for game: ${gamePin}`);
          
          // Strategy 1: Try reconnection if we have stored session data
          const storedSession = GameSessionStorage.getCurrentSession();
          if (storedSession && storedSession.gamePin === gamePin) {
            console.log(`📋 Found matching stored session for ${gamePin}, attempting reconnection...`);
            const reconnectionSuccess = await attemptReconnection();
            if (reconnectionSuccess) {
              console.log(`✅ Reconnection successful for ${gamePin}`);
              setIsAttemptingJoin(false);
              return;
            }
            console.log(`❌ Reconnection failed, falling back to fresh join`);
          }

          // Strategy 2: Fresh join using URL parameters or fallback names
          const playerName = playerNameFromUrl || 
                           GameSessionStorage.getLastPlayerName() || 
                           displayName || 
                           "Player";
          
          console.log(`🚪 Attempting fresh join to ${gamePin} as ${playerName}`);
          await joinRoom({ gamePin, playerName });
          console.log(`✅ Fresh join successful for ${gamePin}`);
          
        } catch (error) {
          console.error(`❌ Auto-join failed for ${gamePin}:`, error);
          const errorMessage = error instanceof Error ? error.message : "Failed to join game";
          setJoinError(errorMessage);
        } finally {
          setIsAttemptingJoin(false);
        }
      };

      // Small delay to avoid race conditions with context initialization
      setTimeout(attemptAutoJoin, 100);
    }
  }, [connectionStatus, gamePin, playerNameFromUrl, displayName, hasAttemptedJoin, isAttemptingJoin, attemptReconnection, joinRoom]);

  // Reset join state when connection status changes to non-disconnected
  useEffect(() => {
    if (connectionStatus !== ConnectionStatus.DISCONNECTED) {
      setIsAttemptingJoin(false);
      setJoinError(null);
    }
  }, [connectionStatus]);

  // Handle leaving game - navigate back to home
  const handleLeaveGame = async () => {
    await leaveRoom();
    router.push('/');
  };

  // Handle retry attempt
  const handleRetry = () => {
    setHasAttemptedJoin(false);
    setJoinError(null);
  };

  // Handle go home action
  const handleGoHome = () => {
    router.push('/');
  };

  // Show loading/error state while not fully connected
  if (connectionStatus === ConnectionStatus.DISCONNECTED || connectionStatus === ConnectionStatus.CONNECTING) {
    return (
      <div className="min-h-dvh safe-bottom flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-glass p-8 border border-white/20 max-w-md w-full">
          {isAttemptingJoin || connectionStatus === ConnectionStatus.CONNECTING ? (
            // Joining state
            <>
              <div className="flex items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
              <h2 className="text-2xl font-bold text-text-main mb-4 text-center">
                {connectionStatus === ConnectionStatus.CONNECTING ? "Connecting..." : "Joining Game..."}
              </h2>
              <p className="text-text-secondary text-center">
                Game Pin: <span className="font-mono font-semibold">{gamePin}</span>
              </p>
              <p className="text-text-secondary text-center text-sm mt-2">
                {connectionStatus === ConnectionStatus.CONNECTING ? "Establishing connection..." : "Connecting to the game room."}
              </p>
            </>
          ) : joinError ? (
            // Error state
            <>
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-text-main mb-4 text-center">
                Unable to Join Game
              </h2>
              <p className="text-text-secondary text-center mb-4">
                Game Pin: <span className="font-mono font-semibold">{gamePin}</span>
              </p>
              <p className="text-red-400 text-center text-sm mb-6 bg-red-500/10 rounded-lg p-3">
                {joinError}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleRetry}
                  className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={handleGoHome}
                  className="w-full bg-white/10 hover:bg-white/20 text-text-secondary hover:text-text-main font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Go to Homepage
                </button>
              </div>
            </>
          ) : (
            // Initial loading state (before auto-join starts)
            <>
              <h2 className="text-2xl font-bold text-text-main mb-4 text-center">
                Loading Game...
              </h2>
              <p className="text-text-secondary text-center">
                Game Pin: <span className="font-mono font-semibold">{gamePin}</span>
              </p>
              <p className="text-text-secondary text-center text-sm mt-2">
                Preparing to join the game room.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Show game interface when connected
  return (
    <GameLayout 
      connectionStatus={connectionStatus}
      gameState={gameState}
      currentPlayerId={currentPlayerId}
      onLeaveGame={handleLeaveGame}
      onStartGame={startGame}
      onSubmitGuess={submitGuess}
      onSetTopics={setTopics}
      onSetDifficulty={setDifficulty}
      onSetTargetScore={setTargetScore}
      onSetRoundTime={setRoundTime}
      onSetMaxPlayers={setMaxPlayers}
      onSendChatMessage={sendChatMessage}
    />
  );
}
