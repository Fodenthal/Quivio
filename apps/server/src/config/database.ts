/**
 * Database Configuration Module
 * 
 * This module defines the configuration interfaces and types for database connections,
 * supporting both SQLite (current) and Supabase (future) database types.
 */

export type DatabaseType = 'sqlite' | 'supabase';

/**
 * Supabase-specific configuration options
 */
export interface SupabaseConfig {
  /** Supabase project URL */
  url: string;
  /** Public API key for client-side operations */
  anonKey: string;
  /** Service role key for admin operations (optional) */
  serviceRoleKey?: string;
}

/**
 * Connection pool configuration for database connections
 */
export interface ConnectionPoolConfig {
  /** Minimum number of connections in the pool */
  min: number;
  /** Maximum number of connections in the pool */
  max: number;
  /** Time in milliseconds before idle connections are closed */
  idleTimeout: number;
}

/**
 * Retry configuration for failed database operations
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Base delay in milliseconds between retries (will be exponential) */
  backoffMs: number;
  /** Maximum timeout in milliseconds for individual operations */
  timeoutMs: number;
}

/**
 * Health check configuration for database monitoring
 */
export interface HealthCheckConfig {
  /** Interval in milliseconds between health checks */
  intervalMs: number;
  /** Timeout in milliseconds for health check operations */
  timeoutMs: number;
  /** Whether to enable automatic health checks */
  enabled: boolean;
}

/**
 * Main database configuration interface
 */
export interface DatabaseConfig {
  /** Type of database to use */
  type: DatabaseType;
  /** Supabase configuration (required when type is 'supabase') */
  supabase?: SupabaseConfig;
  /** Connection pool settings */
  connectionPool?: ConnectionPoolConfig;
  /** Retry configuration for failed operations */
  retryConfig?: RetryConfig;
  /** Health check configuration */
  healthCheck?: HealthCheckConfig;
  /** Whether to enable debug logging for database operations */
  debug?: boolean;
}

/**
 * Default database configuration values
 */
export const DEFAULT_DATABASE_CONFIG: DatabaseConfig = {
  type: 'sqlite',
  connectionPool: {
    min: 2,
    max: 10,
    idleTimeout: 30000, // 30 seconds
  },
  retryConfig: {
    maxRetries: 3,
    backoffMs: 1000, // 1 second
    timeoutMs: 5000, // 5 seconds
  },
  healthCheck: {
    intervalMs: 30000, // 30 seconds
    timeoutMs: 5000, // 5 seconds
    enabled: true,
  },
  debug: false,
};

/**
 * Environment-specific database configurations
 */
export const ENVIRONMENT_CONFIGS: Record<string, Partial<DatabaseConfig>> = {
  development: {
    debug: true,
    connectionPool: {
      min: 1,
      max: 5,
      idleTimeout: 15000, // 15 seconds
    },
  },
  test: {
    debug: true,
    connectionPool: {
      min: 1,
      max: 3,
      idleTimeout: 10000, // 10 seconds
    },
    healthCheck: {
      intervalMs: 60000, // 1 minute
      timeoutMs: 3000, // 3 seconds
      enabled: false, // Disable health checks in tests
    },
  },
  production: {
    debug: false,
    connectionPool: {
      min: 5,
      max: 20,
      idleTimeout: 60000, // 1 minute
    },
    retryConfig: {
      maxRetries: 5,
      backoffMs: 2000, // 2 seconds
      timeoutMs: 10000, // 10 seconds
    },
    healthCheck: {
      intervalMs: 15000, // 15 seconds
      timeoutMs: 3000, // 3 seconds
      enabled: true,
    },
  },
};

/**
 * Validates database configuration
 * @param config - The database configuration to validate
 * @returns Validation result with errors if any
 */
export function validateDatabaseConfig(config: DatabaseConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate required fields based on database type
  if (config.type === 'supabase') {
    if (!config.supabase) {
      errors.push('Supabase configuration is required when type is "supabase"');
    } else {
      if (!config.supabase.url) {
        errors.push('Supabase URL is required');
      }
      if (!config.supabase.anonKey) {
        errors.push('Supabase anonymous key is required');
      }
      if (!config.supabase.url.startsWith('https://')) {
        errors.push('Supabase URL must start with https://');
      }
    }
  }

  // Validate connection pool configuration
  if (config.connectionPool) {
    if (config.connectionPool.min < 1) {
      errors.push('Connection pool minimum must be at least 1');
    }
    if (config.connectionPool.max < config.connectionPool.min) {
      errors.push('Connection pool maximum must be greater than or equal to minimum');
    }
    if (config.connectionPool.idleTimeout < 1000) {
      errors.push('Connection pool idle timeout must be at least 1000ms');
    }
  }

  // Validate retry configuration
  if (config.retryConfig) {
    if (config.retryConfig.maxRetries < 0) {
      errors.push('Max retries must be non-negative');
    }
    if (config.retryConfig.backoffMs < 100) {
      errors.push('Retry backoff must be at least 100ms');
    }
    if (config.retryConfig.timeoutMs < 1000) {
      errors.push('Operation timeout must be at least 1000ms');
    }
  }

  // Validate health check configuration
  if (config.healthCheck) {
    if (config.healthCheck.intervalMs < 5000) {
      errors.push('Health check interval must be at least 5000ms');
    }
    if (config.healthCheck.timeoutMs < 1000) {
      errors.push('Health check timeout must be at least 1000ms');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Merges environment-specific configuration with defaults
 * @param environment - The environment name
 * @param customConfig - Custom configuration overrides
 * @returns Merged database configuration
 */
export function createDatabaseConfig(
  environment: string = 'development',
  customConfig: Partial<DatabaseConfig> = {}
): DatabaseConfig {
  const envConfig = ENVIRONMENT_CONFIGS[environment] || {};
  
  const mergedConfig: DatabaseConfig = {
    ...DEFAULT_DATABASE_CONFIG,
    ...envConfig,
    ...customConfig,
  };

  // Deep merge nested objects
  if (envConfig.connectionPool || customConfig.connectionPool) {
    mergedConfig.connectionPool = {
      ...DEFAULT_DATABASE_CONFIG.connectionPool!,
      ...envConfig.connectionPool,
      ...customConfig.connectionPool,
    };
  }

  if (envConfig.retryConfig || customConfig.retryConfig) {
    mergedConfig.retryConfig = {
      ...DEFAULT_DATABASE_CONFIG.retryConfig!,
      ...envConfig.retryConfig,
      ...customConfig.retryConfig,
    };
  }

  if (envConfig.healthCheck || customConfig.healthCheck) {
    mergedConfig.healthCheck = {
      ...DEFAULT_DATABASE_CONFIG.healthCheck!,
      ...envConfig.healthCheck,
      ...customConfig.healthCheck,
    };
  }

  return mergedConfig;
}