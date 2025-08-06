#!/usr/bin/env tsx

import Database from 'better-sqlite3';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { getDatabaseConfig } from '../../src/config';

interface MigrationStatus {
  sqliteCount: number;
  supabaseCount: number;
  sqliteTopics: Array<{ topic: string; difficulty: number; count: number }>;
  supabaseTopics: Array<{ topic: string; difficulty: number; count: number }>;
  differences: string[];
  isComplete: boolean;
}

class MigrationStatusChecker {
  private sqliteDb: Database.Database | null = null;
  private supabaseClient: any = null;

  /**
   * Initialize connections to both databases
   */
  private async initializeConnections(): Promise<void> {
    console.log('🔌 Initializing database connections...');

    // Initialize SQLite connection
    try {
      const dbPath = path.join(process.cwd(), 'questions.db');
      this.sqliteDb = new Database(dbPath);
      console.log('✅ SQLite connection established');
    } catch (error) {
      throw new Error(`Failed to connect to SQLite: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Initialize Supabase connection
    try {
      const config = getDatabaseConfig();
      if (config.type !== 'supabase' || !config.supabase) {
        throw new Error('Supabase configuration not found. Please set DATABASE_TYPE=supabase and provide SUPABASE_URL and SUPABASE_ANON_KEY');
      }

      this.supabaseClient = createClient(config.supabase.url, config.supabase.anonKey);
      console.log('✅ Supabase connection established');
    } catch (error) {
      throw new Error(`Failed to connect to Supabase: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get question count from SQLite
   */
  private getSqliteCount(): number {
    if (!this.sqliteDb) return 0;
    
    const result = this.sqliteDb.prepare('SELECT COUNT(*) as count FROM questions').get() as { count: number };
    return result.count;
  }

  /**
   * Get question count from Supabase
   */
  private async getSupabaseCount(): Promise<number> {
    if (!this.supabaseClient) return 0;
    
    const { count, error } = await this.supabaseClient
      .from('questions')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw new Error(`Failed to get Supabase count: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Get topic statistics from SQLite
   */
  private getSqliteTopics(): Array<{ topic: string; difficulty: number; count: number }> {
    if (!this.sqliteDb) return [];
    
    const stmt = this.sqliteDb.prepare(`
      SELECT topic, difficulty, COUNT(*) as count
      FROM questions
      GROUP BY topic, difficulty
      ORDER BY topic, difficulty
    `);
    
    return stmt.all() as Array<{ topic: string; difficulty: number; count: number }>;
  }

  /**
   * Get topic statistics from Supabase
   */
  private async getSupabaseTopics(): Promise<Array<{ topic: string; difficulty: number; count: number }>> {
    if (!this.supabaseClient) return [];
    
    const { data, error } = await this.supabaseClient
      .from('questions')
      .select('topic, difficulty')
      .order('topic', { ascending: true });

    if (error) {
      throw new Error(`Failed to get Supabase topics: ${error.message}`);
    }

    // Group by topic and difficulty
    const topicMap = new Map<string, number>();
    data?.forEach((row: any) => {
      const key = `${row.topic}-${row.difficulty}`;
      topicMap.set(key, (topicMap.get(key) || 0) + 1);
    });

    return Array.from(topicMap.entries()).map(([key, count]) => {
      const [topic, difficulty] = key.split('-');
      return {
        topic,
        difficulty: parseInt(difficulty),
        count
      };
    }).sort((a, b) => {
      if (a.topic !== b.topic) return a.topic.localeCompare(b.topic);
      return a.difficulty - b.difficulty;
    });
  }

  /**
   * Compare topic statistics between databases
   */
  private compareTopics(
    sqliteTopics: Array<{ topic: string; difficulty: number; count: number }>,
    supabaseTopics: Array<{ topic: string; difficulty: number; count: number }>
  ): string[] {
    const differences: string[] = [];
    
    // Create maps for easy comparison
    const sqliteMap = new Map<string, number>();
    const supabaseMap = new Map<string, number>();
    
    sqliteTopics.forEach(t => sqliteMap.set(`${t.topic}-${t.difficulty}`, t.count));
    supabaseTopics.forEach(t => supabaseMap.set(`${t.topic}-${t.difficulty}`, t.count));
    
    // Check for missing topics in Supabase
    sqliteTopics.forEach(t => {
      const key = `${t.topic}-${t.difficulty}`;
      const supabaseCount = supabaseMap.get(key) || 0;
      if (supabaseCount < t.count) {
        differences.push(`Missing ${t.count - supabaseCount} questions for topic "${t.topic}" (difficulty: ${t.difficulty})`);
      }
    });
    
    // Check for extra topics in Supabase
    supabaseTopics.forEach(t => {
      const key = `${t.topic}-${t.difficulty}`;
      const sqliteCount = sqliteMap.get(key) || 0;
      if (t.count > sqliteCount) {
        differences.push(`Extra ${t.count - sqliteCount} questions in Supabase for topic "${t.topic}" (difficulty: ${t.difficulty})`);
      }
    });
    
    return differences;
  }

  /**
   * Check migration status
   */
  public async checkStatus(): Promise<MigrationStatus> {
    await this.initializeConnections();
    
    const sqliteCount = this.getSqliteCount();
    const supabaseCount = await this.getSupabaseCount();
    const sqliteTopics = this.getSqliteTopics();
    const supabaseTopics = await this.getSupabaseTopics();
    const differences = this.compareTopics(sqliteTopics, supabaseTopics);
    
    const isComplete = sqliteCount === supabaseCount && differences.length === 0;
    
    return {
      sqliteCount,
      supabaseCount,
      sqliteTopics,
      supabaseTopics,
      differences,
      isComplete
    };
  }

  /**
   * Print migration status
   */
  public async printStatus(): Promise<void> {
    try {
      const status = await this.checkStatus();
      
      console.log('\n📊 Migration Status Report');
      console.log('========================');
      console.log(`SQLite questions: ${status.sqliteCount}`);
      console.log(`Supabase questions: ${status.supabaseCount}`);
      console.log(`Status: ${status.isComplete ? '✅ Complete' : '⚠️ Incomplete'}`);
      
      if (status.differences.length > 0) {
        console.log('\n🔍 Differences found:');
        status.differences.forEach(diff => {
          console.log(`  • ${diff}`);
        });
      }
      
      console.log('\n📈 Topic Breakdown:');
      console.log('SQLite:');
      status.sqliteTopics.forEach(t => {
        console.log(`  • ${t.topic} (difficulty ${t.difficulty}): ${t.count} questions`);
      });
      
      console.log('\nSupabase:');
      status.supabaseTopics.forEach(t => {
        console.log(`  • ${t.topic} (difficulty ${t.difficulty}): ${t.count} questions`);
      });
      
      if (status.isComplete) {
        console.log('\n🎉 Migration is complete! All data has been successfully transferred.');
      } else {
        console.log('\n⚠️ Migration is incomplete. Please run the migration script again.');
      }
      
    } catch (error) {
      console.error('❌ Failed to check migration status:', error instanceof Error ? error.message : String(error));
    } finally {
      if (this.sqliteDb) {
        this.sqliteDb.close();
      }
    }
  }
}

// Run status check if this script is executed directly
if (require.main === module) {
  const checker = new MigrationStatusChecker();
  checker.printStatus().catch(error => {
    console.error('❌ Status check failed:', error);
    process.exit(1);
  });
}

export { MigrationStatusChecker }; 