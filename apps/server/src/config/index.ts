/**
 * Configuration Module Index
 * 
 * This module provides a centralized interface for all configuration-related
 * functionality, including database, environment, and application settings.
 */

// Database configuration exports
export {
  DatabaseType,
  SupabaseConfig,
  ConnectionPoolConfig,
  RetryConfig,
  HealthCheckConfig,
  DatabaseConfig,
  DEFAULT_DATABASE_CONFIG,
  ENVIRONMENT_CONFIGS,
  validateDatabaseConfig,
  createDatabaseConfig,
} from './database';

// Environment configuration exports
export {
  LoggingConfig,
  AIServiceConfig,
  ServerConfig,
  GameConfig,
  EnvironmentConfig,
  loadEnvironmentConfig,
  validateEnvironmentConfig,
  getEnvironmentConfig,
  resetEnvironmentConfig,
  getConfigSection,
} from './environment';

// Re-export commonly used types and functions
export type { DatabaseConfig as Config } from './database';
export { getEnvironmentConfig as getConfig } from './environment';

// Import getEnvironmentConfig for internal use
import { getEnvironmentConfig } from './environment';

/**
 * Quick access functions for common configuration needs
 */

/**
 * Gets the current database configuration
 * @returns The current database configuration
 */
export function getDatabaseConfig() {
  return getEnvironmentConfig().database;
}

/**
 * Gets the current logging configuration
 * @returns The current logging configuration
 */
export function getLoggingConfig() {
  return getEnvironmentConfig().logging;
}

/**
 * Gets the current AI service configuration
 * @returns The current AI service configuration
 */
export function getAIServiceConfig() {
  return getEnvironmentConfig().aiService;
}

/**
 * Gets the current server configuration
 * @returns The current server configuration
 */
export function getServerConfig() {
  return getEnvironmentConfig().server;
}

/**
 * Gets the current game configuration
 * @returns The current game configuration
 */
export function getGameConfig() {
  return getEnvironmentConfig().game;
}

/**
 * Checks if the application is running in development mode
 * @returns True if in development mode
 */
export function isDevelopment(): boolean {
  return getEnvironmentConfig().nodeEnv === 'development';
}

/**
 * Checks if the application is running in production mode
 * @returns True if in production mode
 */
export function isProduction(): boolean {
  return getEnvironmentConfig().nodeEnv === 'production';
}

/**
 * Checks if the application is running in test mode
 * @returns True if in test mode
 */
export function isTest(): boolean {
  return getEnvironmentConfig().nodeEnv === 'test';
}

/**
 * Checks if Supabase is configured as the database
 * @returns True if using Supabase
 */
export function isUsingSupabase(): boolean {
  return getDatabaseConfig().type === 'supabase';
}

/**
 * Checks if SQLite is configured as the database
 * @returns True if using SQLite
 */
export function isUsingSQLite(): boolean {
  return getDatabaseConfig().type === 'sqlite';
}