import { describe, it, beforeEach, afterEach } from 'mocha';
import assert from 'assert';
import {
  getEnvironmentConfig,
  getDatabaseConfig,
  isDevelopment,
  isProduction,
  isTest,
  isUsingSupabase,
  isUsingSQLite,
  resetEnvironmentConfig,
  validateDatabaseConfig,
  createDatabaseConfig,
  DatabaseConfig,
} from '../src/config';

describe('Configuration Module', () => {
  beforeEach(() => {
    // Reset environment config before each test
    resetEnvironmentConfig();
  });

  afterEach(() => {
    // Clean up after each test
    resetEnvironmentConfig();
  });

  describe('Environment Configuration', () => {
    it('should load default configuration when no environment variables are set', () => {
      const config = getEnvironmentConfig();
      
      assert.strictEqual(config.nodeEnv, 'development');
      assert.strictEqual(config.database.type, 'sqlite');
      // Note: geminiApiKey may be loaded from .env.development file in test environment
      assert.strictEqual(typeof config.aiService.geminiApiKey, 'string');
      assert.strictEqual(config.server.port, 2567);
    });

    it('should detect development environment', () => {
      assert.strictEqual(isDevelopment(), true);
      assert.strictEqual(isProduction(), false);
      assert.strictEqual(isTest(), false);
    });

    it('should detect SQLite as default database', () => {
      assert.strictEqual(isUsingSQLite(), true);
      assert.strictEqual(isUsingSupabase(), false);
    });
  });

  describe('Database Configuration', () => {
    it('should create valid SQLite configuration', () => {
      const config = createDatabaseConfig('development', { type: 'sqlite' });
      const validation = validateDatabaseConfig(config);
      
      assert.strictEqual(validation.valid, true);
      assert.strictEqual(validation.errors.length, 0);
    });

    it('should create valid Supabase configuration with required fields', () => {
      const config = createDatabaseConfig('development', {
        type: 'supabase',
        supabase: {
          url: 'https://test.supabase.co',
          anonKey: 'test-anon-key',
          serviceRoleKey: 'test-service-key',
        },
      });
      
      const validation = validateDatabaseConfig(config);
      assert.strictEqual(validation.valid, true);
      assert.strictEqual(validation.errors.length, 0);
    });

    it('should validate Supabase URL format', () => {
      const config = createDatabaseConfig('development', {
        type: 'supabase',
        supabase: {
          url: 'http://invalid-url.com', // Should be https
          anonKey: 'test-key',
        },
      });
      
      const validation = validateDatabaseConfig(config);
      assert.strictEqual(validation.valid, false);
      assert(validation.errors.includes('Supabase URL must start with https://'));
    });

    it('should validate connection pool configuration', () => {
      const config = createDatabaseConfig('development', {
        type: 'sqlite',
        connectionPool: {
          min: 0, // Invalid: should be at least 1
          max: 5,
          idleTimeout: 30000,
        },
      });
      
      const validation = validateDatabaseConfig(config);
      assert.strictEqual(validation.valid, false);
      assert(validation.errors.includes('Connection pool minimum must be at least 1'));
    });

    it('should validate retry configuration', () => {
      const config = createDatabaseConfig('development', {
        type: 'sqlite',
        retryConfig: {
          maxRetries: -1, // Invalid: should be non-negative
          backoffMs: 1000,
          timeoutMs: 5000,
        },
      });
      
      const validation = validateDatabaseConfig(config);
      assert.strictEqual(validation.valid, false);
      assert(validation.errors.includes('Max retries must be non-negative'));
    });
  });

  describe('Configuration Access Functions', () => {
    it('should provide access to database configuration', () => {
      const dbConfig = getDatabaseConfig();
      assert(dbConfig.hasOwnProperty('type'));
      assert(dbConfig.hasOwnProperty('connectionPool'));
      assert(dbConfig.hasOwnProperty('retryConfig'));
    });

    it('should provide access to AI service configuration', () => {
      const aiConfig = getEnvironmentConfig().aiService;
      assert(aiConfig.hasOwnProperty('geminiApiKey'));
      assert(aiConfig.hasOwnProperty('maxConcurrentRequests'));
      assert(aiConfig.hasOwnProperty('requestTimeout'));
    });

    it('should provide access to server configuration', () => {
      const serverConfig = getEnvironmentConfig().server;
      assert(serverConfig.hasOwnProperty('port'));
      assert(serverConfig.hasOwnProperty('host'));
      assert(serverConfig.hasOwnProperty('enableCors'));
    });

    it('should provide access to game configuration', () => {
      const gameConfig = getEnvironmentConfig().game;
      assert(gameConfig.hasOwnProperty('defaultTargetScore'));
      assert(gameConfig.hasOwnProperty('defaultRoundTime'));
      assert(gameConfig.hasOwnProperty('defaultMaxPlayers'));
    });
  });

  describe('Environment-Specific Configuration', () => {
    it('should apply development-specific settings', () => {
      const config = createDatabaseConfig('development');
      assert.strictEqual(config.debug, true);
      assert.strictEqual(config.connectionPool?.min, 1);
      assert.strictEqual(config.connectionPool?.max, 5);
    });

    it('should apply test-specific settings', () => {
      const config = createDatabaseConfig('test');
      assert.strictEqual(config.debug, true);
      assert.strictEqual(config.connectionPool?.min, 1);
      assert.strictEqual(config.connectionPool?.max, 3);
      assert.strictEqual(config.healthCheck?.enabled, false);
    });

    it('should apply production-specific settings', () => {
      const config = createDatabaseConfig('production');
      assert.strictEqual(config.debug, false);
      assert.strictEqual(config.connectionPool?.min, 5);
      assert.strictEqual(config.connectionPool?.max, 20);
      assert.strictEqual(config.retryConfig?.maxRetries, 5);
    });
  });
});