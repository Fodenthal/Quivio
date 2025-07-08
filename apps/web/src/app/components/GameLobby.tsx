"use client";

import { useState } from "react";
import { PlayerData, GameState } from "@shared/index";

interface GameLobbyProps {
  gameState: GameState;
  currentPlayerId: string;
  onPlayerReady: (ready: boolean) => void;
  onStartGame?: () => void;
}

/**
 * GameLobby component displays the pre-game lobby where players can see each other,
 * mark themselves as ready, and the host can start the game.
 * 
 * @param gameState - The current game state containing all room information
 * @param currentPlayerId - The session ID of the current player
 * @param onPlayerReady - Callback function to toggle player ready state
 * @param onStartGame - Optional callback function for host to start the game
 * @returns React component displaying the game lobby interface
 */
export function GameLobby({ 
  gameState, 
  currentPlayerId, 
  onPlayerReady, 
  onStartGame 
}: GameLobbyProps) {
  const [isTogglingReady, setIsTogglingReady] = useState(false);

  const currentPlayer = gameState.players.get(currentPlayerId);
  const isHost = currentPlayer?.isHost || false;
  /**
   * Sorts players array with host first, then by join time.
   * This ensures consistent player order display with the host always at the top.
   * 
   * @returns Array of PlayerData sorted by host status (host first) then join time (earliest first)
   */
  const playersArray = Array.from(gameState.players.values())
    .filter(player => player && player.id) // Filter out any invalid players
    .sort((a, b) => {
      // Sort by: host first, then by join time
      if (a.isHost !== b.isHost) return a.isHost ? -1 : 1;
      return a.joinedAt - b.joinedAt;
    });



  const readyCount = playersArray.filter(p => p.ready).length;
  const totalPlayers = playersArray.length;
  /**
   * Determines if the game can be started based on multiple conditions:
   * - Server-side canStart flag (validates all server-side requirements)
   * - At least 2 players must be ready (client-side validation for UX)
   * 
   * @returns Boolean indicating if the start game button should be enabled
   */
  const canStartGame = gameState.canStart && readyCount > 1;

  /**
   * Handles toggling the current player's ready state.
   * Includes loading state management and error handling to prevent duplicate requests
   * and provide user feedback during the async operation.
   * 
   * @async
   * @returns Promise that resolves when the ready state has been updated
   * @throws Will log error to console if the ready state update fails
   */
  const handleReadyToggle = async () => {
    if (isTogglingReady || !currentPlayer) return;
    
    setIsTogglingReady(true);
    try {
      await onPlayerReady(!currentPlayer.ready);
    } catch (error) {
      console.error("Failed to toggle ready state:", error);
    } finally {
      setIsTogglingReady(false);
    }
  };

  /**
   * Handles the start game action for the host.
   * Validates that both the callback exists and the game can actually be started
   * before attempting to start the game.
   * 
   * @returns void
   */
  const handleStartGame = () => {
    if (onStartGame && canStartGame) {
      onStartGame();
    }
  };

  /**
   * Returns the appropriate emoji icon for a player's ready status.
   * 
   * @param player - The player data object
   * @returns String emoji representing the player's ready state
   */
  const getPlayerStatusIcon = (player: PlayerData) => {
    if (player.ready) {
      return "✅";
    }
    return "⏳";
  };

  /**
   * Returns the text description for a player's ready status.
   * 
   * @param player - The player data object
   * @returns String text describing the player's ready state
   */
  const getPlayerStatusText = (player: PlayerData) => {
    if (player.ready) {
      return "Ready";
    }
    return "Not Ready";
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Game Lobby
        </h2>
        <p className="text-gray-600">
          Players: {totalPlayers}/{gameState.maxPlayers} • Ready: {readyCount}/{totalPlayers}
        </p>
      </div>

      {/* Players List */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Players</h3>
        <div className="space-y-2">
          {playersArray.map((player, index) => {
            const uniqueKey = `${player.id}-${player.name}-${index}`;
            return (
              <div
                key={uniqueKey}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  player.id === currentPlayerId
                    ? "bg-blue-50 border-blue-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{getPlayerStatusIcon(player)}</span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {player.name}
                    </span>
                    {/* 
                      Host badge display - only shown for the designated host player.
                      Host status is determined server-side and synchronized via gameState.
                    */}
                    {player.isHost && (
                      <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">
                        Host
                      </span>
                    )}
                    {/* 
                      Current player indicator - helps user identify their own player card
                      in the list, especially important in rooms with many players.
                    */}
                    {player.id === currentPlayerId && (
                      <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <span className={`text-sm ${
                    player.ready ? "text-green-600" : "text-gray-500"
                  }`}>
                    {getPlayerStatusText(player)}
                  </span>
                </div>
              </div>
              
              {/* Score display */}
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  Score: {player.score}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Ready Toggle Button */}
      <div className="mb-6">
        <button
          onClick={handleReadyToggle}
          disabled={isTogglingReady}
          className={`w-full px-4 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            currentPlayer?.ready
              ? "bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500"
              : "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {/* 
            Dynamic button text based on current state:
            - Shows loading state during async operation
            - Changes text based on current ready status
            - Provides clear action indication to user
          */}
          {isTogglingReady
            ? "Updating..."
            : currentPlayer?.ready
            ? "Mark as Not Ready"
            : "Mark as Ready"
          }
        </button>
      </div>

      {/* Host Controls - Only rendered for the designated host player */}
      {isHost && (
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Host Controls</h3>
          <div className="space-y-3">
            <button
              onClick={handleStartGame}
              disabled={!canStartGame}
              className={`w-full px-4 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                canStartGame
                  ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {/* 
                Dynamic start game button text:
                - Shows "Start Game" when conditions are met
                - Shows helpful message about how many more ready players are needed
                - Calculates the deficit between ready players and minimum required (2)
              */}
              {canStartGame ? "Start Game" : `Need ${Math.max(2 - readyCount, 0)} more ready players`}
            </button>
            
            {/* Game Settings Display */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Game Settings</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Target Score: {gameState.targetScore} points</div>
                <div>Round Time: {gameState.roundTime / 1000} seconds</div>
                <div>Max Players: {gameState.maxPlayers}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 
        Conditional help message displayed when room has insufficient players.
        Only shown when there are fewer than 2 players total (not just ready players).
        Provides helpful guidance to users about inviting more players.
      */}
      {totalPlayers < 2 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 Waiting for more players to join. Share the room link to invite friends!
          </p>
        </div>
      )}
    </div>
  );
} 