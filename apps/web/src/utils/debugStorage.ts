/**
 * Debug utilities for testing game session storage
 * These functions are for development and testing purposes only
 */

import { GameSessionStorage } from "./gameSessionStorage";

export const debugGameStorage = {
  
  /**
   * Log all current storage data to console
   */
  logAllData(): void {
    console.group("🔍 Game Storage Debug");
    
    const currentSession = GameSessionStorage.getCurrentSession();
    console.log("📋 Current Session:", currentSession);
    
    const recentGames = GameSessionStorage.getRecentGames();
    console.log("🎮 Recent Games:", recentGames);
    
    const lastPlayerName = GameSessionStorage.getLastPlayerName();
    console.log("👤 Last Player Name:", lastPlayerName);
    
    const preferences = GameSessionStorage.getUserPreferences();
    console.log("⚙️ User Preferences:", preferences);
    
    const hasSession = GameSessionStorage.hasActiveSession();
    console.log("🔄 Has Active Session:", hasSession);
    
    const reconnectionData = GameSessionStorage.getReconnectionData();
    console.log("🔗 Reconnection Data:", reconnectionData);
    
    console.groupEnd();
  },

  /**
   * Clear all storage data
   */
  clearAll(): void {
    GameSessionStorage.clearAllData();
    console.log("🗑️ Cleared all game storage data");
  },

  /**
   * Simulate a game session for testing
   */
  simulateSession(): void {
    const mockSessionData = {
      gamePin: "TEST123",
      playerName: "TestPlayer",
      playerId: "test-player-id",
      roomId: "test-room-id",
      reconnectionToken: "test-reconnection-token-123456",
      hostId: "test-host-id",
      lastConnected: Date.now(),
      currentRound: 3,
      playerScore: 150,
      gameStatus: "IN_PROGRESS"
    };

    GameSessionStorage.saveCurrentSession(mockSessionData);
    console.log("🎭 Simulated game session created:", mockSessionData);
  },

  /**
   * Add test recent games
   */
  addTestRecentGames(): void {
    const testGames = [
      {
        gamePin: "ABC123",
        roomName: "Friday Night Trivia",
        playerName: "TestPlayer",
        isHost: true
      },
      {
        gamePin: "XYZ789",
        roomName: "Quick Game",
        playerName: "TestPlayer",
        isHost: false
      }
    ];

    testGames.forEach(game => {
      GameSessionStorage.addRecentGame(game);
    });

    console.log("🎮 Added test recent games:", testGames);
  }
};

// Make it available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugGameStorage = debugGameStorage;
}
