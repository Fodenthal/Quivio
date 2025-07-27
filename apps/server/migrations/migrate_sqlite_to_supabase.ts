#!/usr/bin/env tsx

import Database from 'better-sqlite3';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { getDatabaseConfig } from '../src/config';

interface MigrationStats {
  totalQuestions: number;
  migratedQuestions: number;
  skippedQuestions: number;
  errors: string[];
  startTime: Date;
  endTime?: Date;
}

class SqliteToSupabaseMigration {
  private sqliteDb: Database.Database | null = null;
  private supabaseClient: any = null;
  private stats: MigrationStats;

  constructor() {
    this.stats = {
      totalQuestions: 0,
      migratedQuestions: 0,
      skippedQuestions: 0,
      errors: [],
      startTime: new Date()
    };
  }

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
   * Validate that both databases are accessible
   */
  private async validateConnections(): Promise<void> {
    console.log('🔍 Validating database connections...');

    // Test SQLite connection
    if (!this.sqliteDb) {
      throw new Error('SQLite connection not established');
    }

    try {
      const sqliteTest = this.sqliteDb.prepare('SELECT COUNT(*) as count FROM questions').get() as { count: number };
      this.stats.totalQuestions = sqliteTest.count;
      console.log(`📊 SQLite contains ${this.stats.totalQuestions} questions`);
    } catch (error) {
      throw new Error(`SQLite validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Test Supabase connection
    if (!this.supabaseClient) {
      throw new Error('Supabase connection not established');
    }

    try {
      const { data, error } = await this.supabaseClient
        .from('questions')
        .select('count', { count: 'exact', head: true });

      if (error) {
        throw new Error(`Supabase validation failed: ${error.message}`);
      }

      console.log(`📊 Supabase contains ${data?.[0]?.count || 0} questions`);
    } catch (error) {
      throw new Error(`Supabase validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Transform SQLite data to Supabase format
   */
  private transformQuestion(sqliteQuestion: any): any {
    return {
      topic: sqliteQuestion.topic,
      difficulty: sqliteQuestion.difficulty,
      question: sqliteQuestion.question,
      correct_answer: sqliteQuestion.correctAnswer,
      acceptable_answers: sqliteQuestion.acceptableAnswers, // Already JSON string
      category: sqliteQuestion.category,
      created_at: sqliteQuestion.createdAt,
      used_count: sqliteQuestion.usedCount
    };
  }

  /**
   * Migrate questions in batches
   */
  private async migrateQuestions(): Promise<void> {
    console.log('🚀 Starting data migration...');

    if (!this.sqliteDb || !this.supabaseClient) {
      throw new Error('Database connections not established');
    }

    const batchSize = 100;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        // Fetch batch from SQLite
        const stmt = this.sqliteDb.prepare(`
          SELECT * FROM questions 
          ORDER BY id 
          LIMIT ? OFFSET ?
        `);
        
        const batch = stmt.all(batchSize, offset) as any[];
        
        if (batch.length === 0) {
          hasMore = false;
          break;
        }

        console.log(`📦 Processing batch ${Math.floor(offset / batchSize) + 1} (${batch.length} questions)...`);

        // Transform and insert batch into Supabase
        const transformedBatch = batch.map(q => this.transformQuestion(q));
        
        const { data, error } = await this.supabaseClient
          .from('questions')
          .upsert(transformedBatch, { 
            onConflict: 'question',
            ignoreDuplicates: false 
          });

        if (error) {
          // Handle individual question errors
          if (error.code === '23505') { // Unique constraint violation
            console.log(`⚠️ Skipping duplicate questions in batch ${Math.floor(offset / batchSize) + 1}`);
            this.stats.skippedQuestions += batch.length;
          } else {
            throw new Error(`Supabase insert error: ${error.message}`);
          }
        } else {
          this.stats.migratedQuestions += batch.length;
          console.log(`✅ Migrated ${batch.length} questions`);
        }

        offset += batchSize;

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`❌ Error in batch ${Math.floor(offset / batchSize) + 1}: ${errorMsg}`);
        this.stats.errors.push(errorMsg);
        
        // Continue with next batch instead of failing completely
        offset += batchSize;
      }
    }
  }

  /**
   * Print migration statistics
   */
  private printStats(): void {
    this.stats.endTime = new Date();
    const duration = this.stats.endTime.getTime() - this.stats.startTime.getTime();
    const durationSeconds = Math.round(duration / 1000);

    console.log('\n📊 Migration Statistics:');
    console.log('========================');
    console.log(`Total questions in SQLite: ${this.stats.totalQuestions}`);
    console.log(`Successfully migrated: ${this.stats.migratedQuestions}`);
    console.log(`Skipped (duplicates): ${this.stats.skippedQuestions}`);
    console.log(`Errors: ${this.stats.errors.length}`);
    console.log(`Duration: ${durationSeconds} seconds`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.stats.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    if (this.stats.migratedQuestions > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log(`You can now switch to Supabase by setting DATABASE_TYPE=supabase in your environment.`);
    } else {
      console.log('\n⚠️ Migration completed with issues. Please review the errors above.');
    }
  }

  /**
   * Clean up database connections
   */
  private cleanup(): void {
    if (this.sqliteDb) {
      this.sqliteDb.close();
      console.log('🔌 SQLite connection closed');
    }
  }

  /**
   * Run the complete migration process
   */
  public async run(): Promise<void> {
    try {
      console.log('🔄 Starting SQLite to Supabase migration...\n');
      
      await this.initializeConnections();
      await this.validateConnections();
      await this.migrateQuestions();
      this.printStats();
      
    } catch (error) {
      console.error('❌ Migration failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    } finally {
      this.cleanup();
    }
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  const migration = new SqliteToSupabaseMigration();
  migration.run().catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
}

export { SqliteToSupabaseMigration }; 