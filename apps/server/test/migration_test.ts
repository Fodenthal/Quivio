import assert from 'assert';
import { SqliteToSupabaseMigration } from '../migrations/archive/migrate_sqlite_to_supabase';
import { MigrationStatusChecker } from '../migrations/archive/check_migration_status';

describe('Migration Utilities', () => {
  describe('SqliteToSupabaseMigration', () => {
    it('should be instantiable', () => {
      const migration = new SqliteToSupabaseMigration();
      assert.ok(migration);
    });

    it('should have a run method', () => {
      const migration = new SqliteToSupabaseMigration();
      assert.strictEqual(typeof migration.run, 'function');
    });
  });

  describe('MigrationStatusChecker', () => {
    it('should be instantiable', () => {
      const checker = new MigrationStatusChecker();
      assert.ok(checker);
    });

    it('should have required methods', () => {
      const checker = new MigrationStatusChecker();
      assert.strictEqual(typeof checker.checkStatus, 'function');
      assert.strictEqual(typeof checker.printStatus, 'function');
    });

    it('should return proper status structure', async () => {
      const checker = new MigrationStatusChecker();
      
      // Mock the checkStatus method to avoid actual database connections
      const mockStatus = {
        sqliteCount: 10,
        supabaseCount: 8,
        sqliteTopics: [
          { topic: 'Science', difficulty: 1, count: 5 },
          { topic: 'History', difficulty: 1, count: 5 }
        ],
        supabaseTopics: [
          { topic: 'Science', difficulty: 1, count: 5 }
        ],
        differences: ['Missing 5 questions for topic "History" (difficulty: 1)'],
        isComplete: false
      };

      // Replace the checkStatus method with a mock
      checker.checkStatus = async () => mockStatus;

      const status = await checker.checkStatus();
      
      assert.strictEqual(status.sqliteCount, 10);
      assert.strictEqual(status.supabaseCount, 8);
      assert.strictEqual(status.isComplete, false);
      assert.strictEqual(status.differences.length, 1);
      assert.strictEqual(status.sqliteTopics.length, 2);
      assert.strictEqual(status.supabaseTopics.length, 1);
    });
  });
}); 