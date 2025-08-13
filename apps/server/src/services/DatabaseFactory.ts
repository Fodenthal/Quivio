import { isUsingSupabase } from '../config';
import { QuestionDatabase } from './QuestionDatabase';
import { SupabaseQuestionDatabase } from './SupabaseQuestionDatabase';

/**
 * Database interface that both implementations must follow
 */
export interface IQuestionDatabase {
  storeQuestion(topic: string, difficulty: number, question: any): Promise<boolean> | boolean;
  getQuestions(topic: string, difficulty: number, limit?: number): Promise<any[]> | any[];
  markQuestionAsUsed(questionText: string): Promise<void> | void;
  getStats(): Promise<{ totalQuestions: number; topicCount: number; avgUsagePerQuestion: number }> | { totalQuestions: number; topicCount: number; avgUsagePerQuestion: number };
  close(): void;
  hasEnoughQuestions(topic: string, difficulty: number, minRequired?: number): Promise<boolean> | boolean;
  getAvailableTopics(): Promise<Array<{ topic: string; difficulty: number; count: number }>> | Array<{ topic: string; difficulty: number; count: number }>;
  getAllQuestions(limit?: number): Promise<any[]> | any[];
  searchQuestions(searchTerm: string, limit?: number): Promise<any[]> | any[];
  /**
   * Return popular topics ranked by usage and availability. The list should be
   * ordered by total usage first (descending), then by number of questions.
   */
  getPopularTopics(limit?: number): Promise<Array<{ topic: string; questionCount: number; totalUsedCount: number }>> | Array<{ topic: string; questionCount: number; totalUsedCount: number }>;
}

/**
 * Database factory that returns the appropriate database implementation
 * based on the current configuration
 */
export class DatabaseFactory {
  private static instance: IQuestionDatabase | null = null;

  /**
   * Get the appropriate database instance based on configuration
   * @returns The database instance (SQLite or Supabase)
   */
  public static getInstance(): IQuestionDatabase {
    if (!DatabaseFactory.instance) {
      if (isUsingSupabase()) {
        console.log('🔧 Using Supabase database implementation');
        DatabaseFactory.instance = SupabaseQuestionDatabase.getInstance();
      } else {
        console.log('🔧 Using SQLite database implementation');
        DatabaseFactory.instance = QuestionDatabase.getInstance();
      }
    } else {
      console.log('🔧 Reusing existing database instance');
    }
    return DatabaseFactory.instance;
  }

  /**
   * Reset the database instance (useful for testing)
   */
  public static resetInstance(): void {
    DatabaseFactory.instance = null;
  }

  /**
   * Get the database type currently in use
   * @returns 'sqlite' or 'supabase'
   */
  public static getDatabaseType(): 'sqlite' | 'supabase' {
    return isUsingSupabase() ? 'supabase' : 'sqlite';
  }
} 