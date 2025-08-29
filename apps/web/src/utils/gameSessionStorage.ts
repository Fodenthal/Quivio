/**
 * Game Session Storage Utility
 * 
 * Manages persistent storage of game session data for reconnection and state recovery.
 * Uses layered storage approach:
 * - localStorage: Durable user preferences and recent game history
 * - sessionStorage: Temporary session data that expires when tab closes
 */

export interface GameSessionData {
  gamePin: string;
  playerName: string;
  playerId: string;
  roomId: string;
  reconnectionToken: string; // NEW - for Colyseus reconnection
  hostId: string;
  lastConnected: number; // timestamp
  currentRound: number;
  playerScore: number;
  gameStatus: string;
}

export interface RecentGame {
  gamePin: string;
  roomName: string;
  playerName: string;
  lastPlayed: number;
  isHost: boolean;
}

export interface GameStorageData {
  // Current active session
  currentSession: GameSessionData | null;
  
  // Recent games for quick rejoin
  recentGames: RecentGame[];
  
  // User preferences
  lastPlayerName: string;
  preferredSettings: {
    topics: string[];
    difficulty: number;
    targetScore: number;
    roundTime: number;
  };
}

const STORAGE_KEY = 'quivio_game_session';
const RECENT_GAMES_KEY = 'quivio_recent_games';
const SESSION_KEY = 'quivio_active_session';
const MAX_RECENT_GAMES = 10;
const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Storage utility class for managing game session persistence
 */
export class GameSessionStorage {
  
  /**
   * Save current active session data to sessionStorage
   * This data expires when the browser tab is closed
   */
  static saveCurrentSession(sessionData: GameSessionData): void {
    try {
      const dataWithTimestamp = {
        ...sessionData,
        lastConnected: Date.now()
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(dataWithTimestamp));
    } catch (error) {
      console.warn('Failed to save session data:', error);
    }
  }

  /**
   * Get current active session data from sessionStorage
   * Returns null if no session or session is expired
   */
  static getCurrentSession(): GameSessionData | null {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (!stored) return null;

      const sessionData: GameSessionData = JSON.parse(stored);
      
      // Check if session is still valid (not too old)
      const age = Date.now() - sessionData.lastConnected;
      if (age > SESSION_TIMEOUT_MS) {
        this.clearCurrentSession();
        return null;
      }

      return sessionData;
    } catch (error) {
      console.warn('Failed to load session data:', error);
      return null;
    }
  }

  /**
   * Clear current session data
   */
  static clearCurrentSession(): void {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.warn('Failed to clear session data:', error);
    }
  }

  /**
   * Add a game to recent games list in localStorage
   * This persists across browser sessions for quick rejoin
   */
  static addRecentGame(gameData: Omit<RecentGame, 'lastPlayed'>): void {
    try {
      const recentGames = this.getRecentGames();
      
      // Remove duplicate if exists
      const filteredGames = recentGames.filter(game => 
        game.gamePin !== gameData.gamePin
      );
      
      // Add new game at the beginning
      const updatedGames = [
        { ...gameData, lastPlayed: Date.now() },
        ...filteredGames
      ].slice(0, MAX_RECENT_GAMES); // Keep only the most recent games
      
      localStorage.setItem(RECENT_GAMES_KEY, JSON.stringify(updatedGames));
    } catch (error) {
      console.warn('Failed to save recent game:', error);
    }
  }

  /**
   * Get list of recent games from localStorage
   */
  static getRecentGames(): RecentGame[] {
    try {
      const stored = localStorage.getItem(RECENT_GAMES_KEY);
      if (!stored) return [];

      const recentGames: RecentGame[] = JSON.parse(stored);
      
      // Filter out very old games (older than 30 days)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      return recentGames.filter(game => game.lastPlayed > thirtyDaysAgo);
    } catch (error) {
      console.warn('Failed to load recent games:', error);
      return [];
    }
  }

  /**
   * Get the full storage data object
   */
  private static getStorageData(): { preferredSettings: GameStorageData['preferredSettings']; lastPlayerName: string } {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return {
          preferredSettings: {
            topics: [],
            difficulty: 3,
            targetScore: 10,
            roundTime: 30000
          },
          lastPlayerName: ''
        };
      }

      const data = JSON.parse(stored);
      return {
        preferredSettings: data.preferredSettings || {
          topics: [],
          difficulty: 3,
          targetScore: 10,
          roundTime: 30000
        },
        lastPlayerName: data.lastPlayerName || ''
      };
    } catch (error) {
      console.warn('Failed to load storage data:', error);
      return {
        preferredSettings: {
          topics: [],
          difficulty: 3,
          targetScore: 10,
          roundTime: 30000
        },
        lastPlayerName: ''
      };
    }
  }

  /**
   * Save user preferences to localStorage
   */
  static saveUserPreferences(preferences: GameStorageData['preferredSettings']): void {
    try {
      const existingData = this.getStorageData();
      const updated = { ...existingData.preferredSettings, ...preferences };
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        preferredSettings: updated,
        lastPlayerName: existingData.lastPlayerName
      }));
    } catch (error) {
      console.warn('Failed to save user preferences:', error);
    }
  }

  /**
   * Get user preferences from localStorage
   */
  static getUserPreferences(): GameStorageData['preferredSettings'] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return {
          topics: [],
          difficulty: 3,
          targetScore: 10,
          roundTime: 30000
        };
      }

      const data = JSON.parse(stored);
      return data.preferredSettings || {
        topics: [],
        difficulty: 3,
        targetScore: 10,
        roundTime: 30000
      };
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
      return {
        topics: [],
        difficulty: 3,
        targetScore: 10,
        roundTime: 30000
      };
    }
  }

  /**
   * Save last used player name
   */
  static saveLastPlayerName(playerName: string): void {
    try {
      const existingData = this.getStorageData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        preferredSettings: existingData.preferredSettings,
        lastPlayerName: playerName
      }));
    } catch (error) {
      console.warn('Failed to save player name:', error);
    }
  }

  /**
   * Get last used player name
   */
  static getLastPlayerName(): string | null {
    try {
      const data = this.getStorageData();
      return data.lastPlayerName || null;
    } catch (error) {
      console.warn('Failed to load player name:', error);
      return null;
    }
  }

  /**
   * Clear all stored game data
   */
  static clearAllData(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(RECENT_GAMES_KEY);
      sessionStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.warn('Failed to clear storage data:', error);
    }
  }

  /**
   * Check if we have any session data that suggests user was in a game
   */
  static hasActiveSession(): boolean {
    return this.getCurrentSession() !== null;
  }

  /**
   * Get session data for auto-reconnection attempts
   */
  static getReconnectionData(): { gamePin: string; playerName: string } | null {
    const session = this.getCurrentSession();
    if (!session) return null;

    return {
      gamePin: session.gamePin,
      playerName: session.playerName
    };
  }
}
