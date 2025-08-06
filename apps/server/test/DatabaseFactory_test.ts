import assert from 'assert';
import { DatabaseFactory } from '../src/services/DatabaseFactory';
import { resetEnvironmentConfig } from '../src/config';

describe('DatabaseFactory', () => {
  afterEach(() => {
    // Reset the factory instance and environment config after each test
    DatabaseFactory.resetInstance();
    resetEnvironmentConfig();
  });

  describe('getInstance', () => {
    it('should return SQLite implementation by default', () => {
      // Ensure default environment
      delete process.env.DATABASE_TYPE;
      
      const instance = DatabaseFactory.getInstance();
      const dbType = DatabaseFactory.getDatabaseType();
      
      assert.strictEqual(dbType, 'sqlite');
      assert.notStrictEqual(instance, null);
    });

    it('should return Supabase implementation when configured', () => {
      // Set up Supabase environment
      process.env.DATABASE_TYPE = 'supabase';
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      
      // Reset environment config to pick up new variables
      resetEnvironmentConfig();
      
      const instance = DatabaseFactory.getInstance();
      const dbType = DatabaseFactory.getDatabaseType();
      
      assert.strictEqual(dbType, 'supabase');
      assert.notStrictEqual(instance, null);
      
      // Clean up
      delete process.env.DATABASE_TYPE;
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_ANON_KEY;
    });

    it('should return the same instance (singleton pattern)', () => {
      const instance1 = DatabaseFactory.getInstance();
      const instance2 = DatabaseFactory.getInstance();
      assert.strictEqual(instance1, instance2);
    });
  });

  describe('getDatabaseType', () => {
    it('should return sqlite by default', () => {
      delete process.env.DATABASE_TYPE;
      const dbType = DatabaseFactory.getDatabaseType();
      assert.strictEqual(dbType, 'sqlite');
    });

    it('should return supabase when configured', () => {
      process.env.DATABASE_TYPE = 'supabase';
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      
      // Reset environment config to pick up new variables
      resetEnvironmentConfig();
      
      const dbType = DatabaseFactory.getDatabaseType();
      assert.strictEqual(dbType, 'supabase');
      
      // Clean up
      delete process.env.DATABASE_TYPE;
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_ANON_KEY;
    });
  });

  describe('resetInstance', () => {
    it('should reset the singleton instance', () => {
      // Get first instance (SQLite by default)
      const instance1 = DatabaseFactory.getInstance();
      
      // Reset and change to Supabase
      DatabaseFactory.resetInstance();
      process.env.DATABASE_TYPE = 'supabase';
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      resetEnvironmentConfig();
      
      const instance2 = DatabaseFactory.getInstance();
      
      // Should be different instances after reset
      assert.notStrictEqual(instance1, instance2);
      
      // Clean up
      delete process.env.DATABASE_TYPE;
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_ANON_KEY;
    });
  });
}); 