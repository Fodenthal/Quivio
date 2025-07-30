"use client";

import { useState, useEffect, useCallback } from "react";
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
      case 1: return "text-success";
      case 2: return "text-info";
      case 3: return "text-warning";
      case 4: return "text-orange-400";
      case 5: return "text-error";
      default: return "text-warning";
    }
  };

  /**
   * Get room status info
   */
  const getRoomStatus = (room: RoomMetadata) => {
    const isFull = room.playerCount >= room.maxPlayers;
    const isJoinable = !isFull && !room.gameStarted;
    
    if (isFull) {
      return { label: "Full", color: "text-error", joinable: false };
    }
    if (room.gameStarted) {
      return { label: "In Progress", color: "text-warning", joinable: false };
    }
    if (room.canStart) {
      return { label: "Ready to Start", color: "text-success", joinable: true };
    }
    return { label: "Waiting", color: "text-info", joinable: isJoinable };
  };

  // Fetch rooms on component mount and set up auto-refresh
  useEffect(() => {
    fetchActiveRooms();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchActiveRooms, 10000);
    
    return () => clearInterval(interval);
  }, [fetchActiveRooms]);

  if (loading) {
    return (
      <div className={`card h-full flex items-center justify-center animate-cursor-in ${className}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-light-accent-primary/30 dark:border-dark-accent-primary/30 border-t-light-accent-primary dark:border-t-dark-accent-primary rounded-full animate-spin"></div>
          <span className="text-cursor-secondary">Loading active rooms...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`card h-full flex items-center justify-center animate-cursor-in ${className}`}>
        <div className="text-center">
          <h3 className="heading-cursor text-xl mb-2">Failed to Load Rooms</h3>
          <p className="text-cursor-secondary mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-primary px-6 py-3 text-lg font-semibold"
          >
            {refreshing ? 'Retrying...' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className={`card h-full flex items-center justify-center animate-cursor-in ${className}`}>
        <div className="text-center">
          <h3 className="heading-cursor text-xl mb-2">No Active Rooms</h3>
          <p className="text-cursor-secondary mb-6">Be the first to create a room and start playing!</p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-primary px-6 py-3 text-lg font-semibold"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`card h-full flex flex-col animate-cursor-in ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-light-border-primary dark:border-dark-border-primary">
        <div>
          <h3 className="heading-cursor text-xl">Active Rooms</h3>
          <p className="text-cursor-secondary text-sm mt-1">{rooms.length} rooms available</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-ghost px-6 py-3 text-lg font-semibold"
        >
          {refreshing ? (
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-light-text-secondary/30 dark:border-dark-text-secondary/30 border-t-light-text-secondary dark:border-t-dark-text-secondary rounded-full animate-spin"></div>
              Refreshing...
            </div>
          ) : (
            '↻ Refresh'
          )}
        </button>
      </div>

      {/* Rooms Grid */}
      <div className="p-6 flex-1 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {rooms.map((room) => {
            const status = getRoomStatus(room);
            const difficultyLabel = getDifficultyLabel(room.difficulty);
            const difficultyColor = getDifficultyColor(room.difficulty);

            return (
              <div
                key={room.gamePin}
                className="card p-6 hover:shadow-cursor-lg transition-all duration-200 animate-cursor-up"
              >
                {/* Room Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="heading-cursor text-lg truncate">
                      {room.roomName}
                    </h4>
                    <div className="text-cursor-secondary text-sm mt-2 mb-3">
                      Topics: {room.topics.join(", ")}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-cursor-secondary">
                        Pin: <span className="font-mono font-bold text-light-accent-primary dark:text-dark-accent-primary">{room.gamePin}</span>
                      </span>
                      <span className={`text-sm font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Room Details */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-sm text-cursor-secondary">Players</div>
                    <div className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary">
                      {room.playerCount}/{room.maxPlayers}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-cursor-secondary">Difficulty</div>
                    <div className={`text-sm font-semibold ${difficultyColor}`}>
                      {difficultyLabel}
                    </div>
                  </div>
                </div>

                {/* Join Button */}
                <button
                  onClick={() => handleJoinRoom(room.gamePin)}
                  disabled={!status.joinable || !onJoinRoom}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    status.joinable && onJoinRoom
                      ? 'btn-primary'
                      : 'bg-light-background-tertiary dark:bg-dark-background-tertiary text-light-text-muted dark:text-dark-text-muted cursor-not-allowed'
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