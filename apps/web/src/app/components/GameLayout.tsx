"use client";

import { useState, useEffect } from "react";
import { GameClient, ConnectionStatus } from "@/lib/gameClient";

interface GameLayoutProps {
  children?: React.ReactNode;
}

export function GameLayout({ children }: GameLayoutProps) {
  const [gameClient] = useState(() => new GameClient());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED
  );
  const [playerName, setPlayerName] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    // Set up event handlers for connection status changes
    gameClient.setEventHandlers({
      onConnectionStatusChange: (status) => {
        setConnectionStatus(status);
      },
      onError: (error) => {
        console.error("Game client error:", error);
        setIsJoining(false);
      },
    });

    // Cleanup on unmount
    return () => {
      gameClient.dispose();
    };
  }, [gameClient]);

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      alert("Please enter your name");
      return;
    }

    setIsJoining(true);
    try {
      await gameClient.joinRoom({
        playerName: playerName.trim(),
      });
    } catch (error) {
      console.error("Failed to join room:", error);
      alert("Failed to join room. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const getStatusColor = (status: ConnectionStatus) => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return "bg-green-500";
      case ConnectionStatus.CONNECTING:
      case ConnectionStatus.RECONNECTING:
        return "bg-yellow-500";
      case ConnectionStatus.ERROR:
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: ConnectionStatus) => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return "Connected";
      case ConnectionStatus.CONNECTING:
        return "Connecting...";
      case ConnectionStatus.RECONNECTING:
        return "Reconnecting...";
      case ConnectionStatus.ERROR:
        return "Connection Error";
      default:
        return "Disconnected";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with connection status */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">PopReplay</h1>
            
            {/* Connection Status Indicator */}
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${getStatusColor(connectionStatus)}`}
              />
              <span className="text-sm font-medium text-gray-700">
                {getStatusText(connectionStatus)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {connectionStatus === ConnectionStatus.DISCONNECTED ? (
          // Join Room Interface
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Join Game
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  id="playerName"
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isJoining) {
                      handleJoinRoom();
                    }
                  }}
                />
              </div>
              <button
                onClick={handleJoinRoom}
                disabled={isJoining || !playerName.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isJoining ? "Joining..." : "Join Game"}
              </button>
            </div>
          </div>
        ) : (
          // Game Interface (placeholder for now)
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Game Interface
            </h2>
            <p className="text-gray-600">
              Connected to game! Game interface will be implemented in the next phase.
            </p>
            {children}
          </div>
        )}
      </main>
    </div>
  );
} 