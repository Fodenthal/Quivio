"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useDisplayName } from "../../contexts/DisplayNameContext";

/**
 * Room metadata interface matching the server's RoomMetadata
 */
export interface RoomMetadata {
  gamePin: string;
  roomId: string;
  roomName: string;
  topics: string[];
  difficulty: number;
  playerCount: number;
  maxPlayers: number;
  isPrivate: boolean;
  gameStarted: boolean;
  canStart: boolean;
  createdAt: number;
}

/**
 * API response interface for active rooms endpoint
 */
interface ActiveRoomsResponse {
  rooms: RoomMetadata[];
  totalRooms: number;
  success: boolean;
  timestamp: number;
}

export interface ActiveRoomsListProps {
  onJoinRoom?: (playerName: string, gamePin: string) => void;
  className?: string;
}

/**
 * Component to display list of active rooms fetched from the server
 * Shows room cards with metadata and join functionality
 */
export function ActiveRoomsList({ onJoinRoom, className = "" }: ActiveRoomsListProps) {
  const { displayName } = useDisplayName();
  const [rooms, setRooms] = useState<RoomMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // Deterministic initial value to avoid SSR/client hydration mismatch.
  const [privateRoomsCount, setPrivateRoomsCount] = useState<number>(5);
  // Initialize on client after mount to avoid SSR/non-deterministic mismatch.
  const nextPrivateRoomsChangeAtRef = useRef<number>(0);

  /**
   * Calculate the next private rooms display count.
   * Keeps the value within [3, 10] and varies by 1–2 each update.
   * @param current Current displayed private rooms count
   * @returns Next displayed private rooms count within bounds
   */
  const calculateNextPrivateRoomsCount = (current: number): number => {
    const min = 3;
    const max = 10;

    // Possible deltas: -2, -1, +1, +2 (exclude 0)
    const deltas = [-2, -1, 1, 2];
    // Filter deltas that keep the value within bounds
    const validDeltas = deltas.filter((delta) => current + delta >= min && current + delta <= max);
    if (validDeltas.length === 0) return current; // Safeguard, though bounds logic should prevent this
    const chosenDelta = validDeltas[Math.floor(Math.random() * validDeltas.length)];
    return current + chosenDelta;
  };

  /**
   * Schedule the next time the private rooms count may change.
   * Uses a randomized delay to make changes feel organic and less frequent.
   * Currently set to 60–180 seconds.
   * @returns Epoch timestamp in milliseconds for the next change
   */
  const scheduleNextPrivateRoomsChange = (): number => {
    const now = Date.now();
    const delaySeconds = Math.floor(Math.random() * (180 - 60 + 1)) + 60;
    return now + delaySeconds * 1000;
  };

  /**
   * Fetch active rooms from the server API
   */
  const fetchActiveRooms = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/rooms/active');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: ActiveRoomsResponse = await response.json();
      
      if (!data.success) {
        throw new Error('API returned error status');
      }
      
      setRooms(data.rooms);
      console.log(`📋 Loaded ${data.rooms.length} active rooms`);
    } catch (error) {
      console.error('Failed to fetch active rooms:', error);
      setError(error instanceof Error ? error.message : 'Failed to load rooms');
      setRooms([]); // Clear rooms on error
    } finally {
      setLoading(false);
      setRefreshing(false);
      // Update the private rooms display count only when scheduled
      const now = Date.now();
      if (now >= nextPrivateRoomsChangeAtRef.current) {
        setPrivateRoomsCount((current) => calculateNextPrivateRoomsCount(current));
        nextPrivateRoomsChangeAtRef.current = scheduleNextPrivateRoomsChange();
      }
    }
  }, []);

  /**
   * Manual refresh function
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchActiveRooms();
  }, [fetchActiveRooms]);

  /**
   * Handle joining a room
   */
  const handleJoinRoom = useCallback(async (gamePin: string) => {
    if (!onJoinRoom) {
      console.warn('No onJoinRoom handler provided');
      return;
    }

    try {
      await onJoinRoom(displayName, gamePin);
    } catch (error) {
      console.error('Failed to join room:', error);
      // Error handling is managed by the parent component
    }
  }, [onJoinRoom, displayName]);

  /**
   * Get difficulty label from numeric value (5-tier system)
   */
  const getDifficultyLabel = (difficulty: number): string => {
    switch(difficulty) {
      case 1: return "Very Easy";
      case 2: return "Easy";
      case 3: return "Medium";
      case 4: return "Hard";
      case 5: return "Very Hard";
      default: return "Medium";
    }
  };

  /**
   * Get difficulty color class (5-tier system)
   */
  const getDifficultyColor = (difficulty: number): string => {
    switch(difficulty) {
      case 1: return "text-green-400";
      case 2: return "text-blue-400";
      case 3: return "text-yellow-400";
      case 4: return "text-orange-400";
      case 5: return "text-red-400";
      default: return "text-yellow-400";
    }
  };

  /**
   * Get room status info
   */
  const getRoomStatus = (room: RoomMetadata) => {
    const isFull = room.playerCount >= room.maxPlayers;
    const isJoinable = !isFull; // Allow joining even if the game has started

    if (isFull) {
      return { label: "Full", color: "text-red-400", joinable: false };
    }
    if (room.gameStarted) {
      return { label: "In Progress", color: "text-yellow-400", joinable: true };
    }
    if (room.canStart) {
      return { label: "Ready to Start", color: "text-green-400", joinable: true };
    }
    return { label: "Waiting", color: "text-blue-400", joinable: isJoinable };
  };

  // Fetch rooms on component mount and set up auto-refresh
  useEffect(() => {
    // Client-only initialization of randomized counters/timers
    setPrivateRoomsCount(Math.floor(Math.random() * (10 - 3 + 1)) + 3);
    nextPrivateRoomsChangeAtRef.current = scheduleNextPrivateRoomsChange();

    fetchActiveRooms();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchActiveRooms, 10000);
    
    return () => clearInterval(interval);
  }, [fetchActiveRooms]);

  if (loading) {
    return (
      <div className={`card p-6 h-full flex flex-col ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="skeleton-text w-40 mb-2"></div>
            <div className="skeleton-text w-32"></div>
          </div>
          <div className="skeleton h-8 w-28 rounded-md"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="card card-hover p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="skeleton-text w-48 mb-2"></div>
                  <div className="skeleton-text w-64 mb-2"></div>
                  <div className="flex items-center space-x-3">
                    <div className="skeleton-text w-24"></div>
                    <div className="skeleton-text w-20"></div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <div className="skeleton-text w-16 mb-2"></div>
                  <div className="skeleton h-6 w-20"></div>
                </div>
                <div>
                  <div className="skeleton-text w-20 mb-2"></div>
                  <div className="skeleton h-6 w-24"></div>
                </div>
              </div>
              <div className="skeleton h-9 w-full rounded-md"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`card p-8 h-full flex items-center justify-center ${className}`}>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-text-main mb-2">Failed to Load Rooms</h3>
          <p className="text-text-secondary mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white
           px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40
           disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {refreshing ? 'Retrying...' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className={`card p-8 h-full flex items-center justify-center ${className}`}>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-text-main mb-2">No Active Rooms</h3>
          <p className="text-text-secondary mb-4">Be the first to create a room and start playing!</p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white
           px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40
           disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`card h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div>
          <h3 className="text-xl font-semibold text-text-main">Active Rooms</h3>
          <p className="text-sm text-text-secondary mt-1">
            {rooms.filter((r) => !r.isPrivate).length} public room, {privateRoomsCount} private rooms
          </p>
        </div>
        <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm
                        text-slate-300 hover:bg-white/10 hover:text-indigo-200
                        focus:outline-none focus:ring-2 focus:ring-indigo-500/40
                        disabled:opacity-50 disabled:cursor-not-allowed"
            >
            <span className={refreshing ? 'animate-spin' : ''}>↻</span>
            Refresh
        </button>

      </div>

      {/* Rooms Grid */}
      <div className="p-4 md:p-6 flex-1 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          {rooms.map((room) => {
            const status = getRoomStatus(room);
            const difficultyLabel = getDifficultyLabel(room.difficulty);
            const difficultyColor = getDifficultyColor(room.difficulty);

            return (
              <div key={room.gamePin} className="card card-hover p-3 md:p-4">
                {/* Room Header */}
                <div className="flex items-start justify-between mb-2 md:mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-semibold text-text-main truncate">
                      {room.roomName}
                    </h4>
                    <div className="text-xs text-text-secondary mt-1 mb-2 truncate">
                      <span className="whitespace-nowrap">Topics: {room.topics.join(", ")}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-text-secondary">
                        Pin: <span className="font-mono font-bold text-blue-500">{room.gamePin}</span>
                      </span>
                      <span className={`text-sm ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Room Details */}
                <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3 md:mb-4">
                  <div className="text-center">
                    <div className="text-sm text-text-secondary">Players</div>
                    <div className="text-lg font-bold text-text-main">
                      {room.playerCount}/{room.maxPlayers}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-text-secondary">Difficulty</div>
                    <div className={`text-sm font-semibold ${difficultyColor}`}>
                      {difficultyLabel}
                    </div>
                  </div>
                </div>

                {/* Join Button */}
                 <button
                  onClick={() => handleJoinRoom(room.gamePin)}
                  disabled={!status.joinable || !onJoinRoom}
                  className={`w-full py-3 px-4 rounded-md font-medium transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none ${
                      status.joinable && onJoinRoom
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white focus:ring-2 focus:ring-emerald-500/40'
                        : 'bg-white/10 text-text-secondary cursor-not-allowed'
                    }`}
                >
                  {!onJoinRoom 
                    ? 'Join Disabled' 
                    : status.joinable 
                      ? 'Join Room' 
                      : status.label === 'Full' 
                        ? 'Room Full' 
                        : 'Game Started'
                  }
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 