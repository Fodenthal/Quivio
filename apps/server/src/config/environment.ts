/**
 * Environment Configuration Module
 * 
 * This module handles environment variable validation, defaults, and provides
 * a centralized configuration interface for the application.
 */

import { DatabaseConfig, createDatabaseConfig, validateDatabaseConfig } from './database';

/**
 * Logging configuration options
 */
export interface LoggingConfig {
  /** Log level for application logging */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** Whether to enable database operation logging */
  enableDatabaseLogs: boolean;
  /** Whether to enable request/response logging */
  enableRequestLogs: boolean;
  /** Whether to enable performance timing logs */
  enableTimingLogs: boolean;
}

/**
 * AI service configuration
 */
export interface AIServiceConfig {
  /** Google Gemini API key */
  geminiApiKey: string;
  /** Maximum number of concurrent AI requests */
  maxConcurrentRequests: number;
  /** Request timeout in milliseconds */
  requestTimeout: number;
}

/**
 * Server configuration options
 */
export interface ServerConfig {
  /** Server port number */
  port: number;
  /** Server host address */
  host: string;
  /** Whether to enable CORS */
  enableCors: boolean;
  /** CORS origins (comma-separated) */
  corsOrigins: string[];
  /** Maximum request body size */
  maxBodySize: string;
}

/**
 * Game configuration options
 */
export interface GameConfig {
  /** Default target score for games */
  defaultTargetScore: number;
  /** Default round time in seconds */
  defaultRoundTime: number;
  /** Default maximum players per room */
  defaultMaxPlayers: number;
  /** Maximum number of rooms */
  maxRooms: number;
  /** Room cleanup interval in milliseconds */
  roomCleanupInterval: number;
}

/**
 * Main environment configuration interface
 */
export interface EnvironmentConfig {
  /** Node.js environment */
  nodeEnv: 'development' | 'production' | 'test';
  /** Database configuration */
  database: DatabaseConfig;
  /** Logging configuration */
  logging: LoggingConfig;
  /** AI service configuration */
  aiService: AIServiceConfig;
  /** Server configuration */
  server: ServerConfig;
  /** Game configuration */
  game: GameConfig;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: EnvironmentConfig = {
  nodeEnv: 'development',
  database: createDatabaseConfig('development'),
  logging: {
    level: 'info',
    enableDatabaseLogs: false,
    enableRequestLogs: true,
    enableTimingLogs: false,
  },
  aiService: {
    geminiApiKey: '',
    maxConcurrentRequests: 10,
    requestTimeout: 30000, // 30 seconds
  },
  server: {
    port: 2567,
    host: '0.0.0.0',
    enableCors: true,
    corsOrigins: ['http://localhost:3000', 'http://localhost:8080'],
    maxBodySize: '10mb',
  },
  game: {
    defaultTargetScore: 100,
    defaultRoundTime: 30,
    defaultMaxPlayers: 10,
    maxRooms: 100,
    roomCleanupInterval: 300000, // 5 minutes
  },
};

/**
 * Loads and validates environment variables
 * @returns Validated environment configuration
 */
export function loadEnvironmentConfig(): EnvironmentConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';
  
  // Load database configuration
  const databaseType = (process.env.DATABASE_TYPE as 'sqlite' | 'supabase') || 'sqlite';
  const databaseConfig = createDatabaseConfig(nodeEnv, {
    type: databaseType,
    supabase: databaseType === 'supabase' ? {
      url: process.env.SUPABASE_URL || '',
      anonKey: process.env.SUPABASE_ANON_KEY || '',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    } : undefined,
    connectionPool: {
      min: parseInt(process.env.DATABASE_POOL_MIN || '2'),
      max: parseInt(process.env.DATABASE_POOL_MAX || '10'),
      idleTimeout: parseInt(process.env.DATABASE_POOL_IDLE_TIMEOUT || '30000'),
    },
    retryConfig: {
      maxRetries: parseInt(process.env.DATABASE_MAX_RETRIES || '3'),
      backoffMs: parseInt(process.env.DATABASE_RETRY_BACKOFF_MS || '1000'),
      timeoutMs: parseInt(process.env.DATABASE_TIMEOUT_MS || '5000'),
    },
    healthCheck: {
      intervalMs: parseInt(process.env.DATABASE_HEALTH_CHECK_INTERVAL || '30000'),
      timeoutMs: parseInt(process.env.DATABASE_HEALTH_CHECK_TIMEOUT || '5000'),
      enabled: process.env.DATABASE_HEALTH_CHECK_ENABLED !== 'false',
    },
    debug: process.env.DATABASE_DEBUG === 'true',
  });

  // Load logging configuration
  const loggingConfig: LoggingConfig = {
    level: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
    enableDatabaseLogs: process.env.ENABLE_DATABASE_LOGS === 'true',
    enableRequestLogs: process.env.ENABLE_REQUEST_LOGS !== 'false',
    enableTimingLogs: process.env.ENABLE_TIMING_LOGS === 'true',
  };

  // Load AI service configuration
  const aiServiceConfig: AIServiceConfig = {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    maxConcurrentRequests: parseInt(process.env.GEMINI_MAX_CONCURRENT_REQUESTS || '10'),
    requestTimeout: parseInt(process.env.GEMINI_REQUEST_TIMEOUT || '30000'),
  };

  // Load server configuration
  const serverConfig: ServerConfig = {
    port: parseInt(process.env.PORT || '2567'),
    host: process.env.HOST || '0.0.0.0',
    enableCors: process.env.ENABLE_CORS !== 'false',
    corsOrigins: process.env.CORS_ORIGINS?.split(',').map(origin => origin.trim()) || 
                 ['http://localhost:3000', 'http://localhost:8080'],
    maxBodySize: process.env.MAX_BODY_SIZE || '10mb',
  };

  // Load game configuration
  const gameConfig: GameConfig = {
    defaultTargetScore: parseInt(process.env.DEFAULT_TARGET_SCORE || '100'),
    defaultRoundTime: parseInt(process.env.DEFAULT_ROUND_TIME || '60'),
    defaultMaxPlayers: parseInt(process.env.DEFAULT_MAX_PLAYERS || '10'),
    maxRooms: parseInt(process.env.MAX_ROOMS || '100'),
    roomCleanupInterval: parseInt(process.env.ROOM_CLEANUP_INTERVAL || '300000'),
  };

  const config: EnvironmentConfig = {
    nodeEnv,
    database: databaseConfig,
    logging: loggingConfig,
    aiService: aiServiceConfig,
    server: serverConfig,
    game: gameConfig,
  };

  // Validate configuration
  const validation = validateEnvironmentConfig(config);
  if (!validation.valid) {
    console.error('❌ Environment configuration validation failed:');
    validation.errors.forEach(error => console.error(`   - ${error}`));
    throw new Error('Invalid environment configuration');
  }

  return config;
}

/**
 * Validates the complete environment configuration
 * @param config - The configuration to validate
 * @returns Validation result with errors if any
 */
export function validateEnvironmentConfig(config: EnvironmentConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate database configuration
  const dbValidation = validateDatabaseConfig(config.database);
  if (!dbValidation.valid) {
    errors.push(...dbValidation.errors.map(error => `Database: ${error}`));
  }

  // Validate AI service configuration
  if (!config.aiService.geminiApiKey) {
    errors.push('AI Service: GEMINI_API_KEY is required');
  }

  // Validate server configuration
  if (config.server.port < 1 || config.server.port > 65535) {
    errors.push('Server: Port must be between 1 and 65535');
  }

  if (config.server.corsOrigins.length === 0) {
    errors.push('Server: At least one CORS origin must be specified');
  }

  // Validate game configuration
  if (config.game.defaultTargetScore < 1) {
    errors.push('Game: Default target score must be at least 1');
  }

  if (config.game.defaultRoundTime < 5) {
    errors.push('Game: Default round time must be at least 5 seconds');
  }

  if (config.game.defaultMaxPlayers < 1) {
    errors.push('Game: Default max players must be at least 1');
  }

  if (config.game.maxRooms < 1) {
    errors.push('Game: Max rooms must be at least 1');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Gets the current environment configuration
 * @returns The current environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  // Use a singleton pattern to avoid reloading configuration
  if (!(global as any).__environmentConfig) {
    (global as any).__environmentConfig = loadEnvironmentConfig();
  }
  return (global as any).__environmentConfig;
}

/**
 * Resets the environment configuration (useful for testing)
 */
export function resetEnvironmentConfig(): void {
  delete (global as any).__environmentConfig;
}

/**
 * Gets a specific configuration section
 * @param section - The configuration section to retrieve
 * @returns The requested configuration section
 */
export function getConfigSection<K extends keyof EnvironmentConfig>(
  section: K
): EnvironmentConfig[K] {
  return getEnvironmentConfig()[section];
}