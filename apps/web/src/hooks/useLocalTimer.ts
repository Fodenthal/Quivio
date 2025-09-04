import { useState, useEffect, useRef, useCallback } from "react";
import { calculateTimeRemaining, formatTime, clockSyncManager } from "@/utils/clockSync";
import type { RoundStartMessage, RoundEndMessage } from "@shared/index";

interface LocalTimerState {
  timeRemaining: number;
  formattedTime: string;
  isUrgent: boolean;
  isActive: boolean;
}

/**
 * Custom hook for smooth local timer rendering using server-synchronized time.
 * Provides 60fps countdown updates without relying on server state patches.
 */
export function useLocalTimer() {
  const [timerState, setTimerState] = useState<LocalTimerState>({
    timeRemaining: 0,
    formattedTime: "0:00",
    isUrgent: false,
    isActive: false
  });

  // Store round data for calculations
  const roundDataRef = useRef<{
    roundStartTime: number;
    roundDurationMs: number;
    roundNumber: number;
  } | null>(null);

  // Animation frame ID for cleanup
  const animationFrameRef = useRef<number | null>(null);

  // Update timer display using requestAnimationFrame for smooth 60fps updates
  const updateTimer = useCallback(() => {
    if (!roundDataRef.current || !clockSyncManager.isSyncRecent()) {
      // No round data or clock sync is stale - stop updating
      setTimerState(prev => ({ ...prev, isActive: false }));
      return;
    }

    const { roundStartTime, roundDurationMs } = roundDataRef.current;
    const timeRemaining = calculateTimeRemaining(roundStartTime, roundDurationMs);
    const formattedTime = formatTime(timeRemaining);
    const isUrgent = timeRemaining < 10000; // Less than 10 seconds
    const isActive = timeRemaining > 0;

    setTimerState({
      timeRemaining,
      formattedTime,
      isUrgent,
      isActive
    });

    // Continue animation if round is still active
    if (isActive) {
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    }
  }, []);

  // Start timer animation loop
  const startTimer = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    updateTimer();
  }, [updateTimer]);

  // Stop timer animation loop
  const stopTimer = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setTimerState(prev => ({ ...prev, isActive: false }));
  }, []);

  // Handle round start event - memoized to prevent infinite loops
  const handleRoundStart = useCallback((message: RoundStartMessage) => {
    console.log("🎯 Local timer: Round start", message);
    
    roundDataRef.current = {
      roundStartTime: message.roundStartTime,
      roundDurationMs: message.roundDurationMs,
      roundNumber: message.roundNumber
    };

    // Start the smooth timer animation
    startTimer();
  }, [startTimer]);

  // Handle round end event - memoized to prevent infinite loops
  const handleRoundEnd = useCallback((message: RoundEndMessage) => {
    console.log("🏁 Local timer: Round end", message);
    
    // Validate this is for the current round
    if (roundDataRef.current && message.roundNumber === roundDataRef.current.roundNumber) {
      stopTimer();
      // Set final state to show round ended
      setTimerState({
        timeRemaining: 0,
        formattedTime: "0:00",
        isUrgent: true,
        isActive: false
      });
    }
  }, [stopTimer]);

  // Memoized reset function to prevent infinite loops
  const reset = useCallback(() => {
    stopTimer();
    roundDataRef.current = null;
    setTimerState({
      timeRemaining: 0,
      formattedTime: "0:00",
      isUrgent: false,
      isActive: false
    });
  }, [stopTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    ...timerState,
    handleRoundStart,
    handleRoundEnd,
    reset
  };
}
