import assert from 'assert';
import { SupabaseQuestionDatabase } from '../src/services/SupabaseQuestionDatabase';
import { GeneratedQuestion } from '../src/services/GeminiService';

describe('SupabaseQuestionDatabase', () => {
  let database: SupabaseQuestionDatabase;

  before(() => {
    // Set up test environment variables for Supabase
    process.env.DATABASE_TYPE = 'supabase';
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-anon-key';
  });

  after(() => {
    // Reset environment variables
    delete process.env.DATABASE_TYPE;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
  });

  beforeEach(() => {
    // Reset the singleton instance for each test
    (SupabaseQuestionDatabase as any).instance = null;
    database = SupabaseQuestionDatabase.getInstance();
  });

  describe('getInstance', () => {
    it('should return the same instance (singleton pattern)', () => {
      const instance1 = SupabaseQuestionDatabase.getInstance();
      const instance2 = SupabaseQuestionDatabase.getInstance();
      assert.strictEqual(instance1, instance2);
    });
  });

  describe('storeQuestion', () => {
    it('should handle missing Supabase configuration gracefully', async () => {
      // Reset environment to simulate missing config
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_ANON_KEY;
      
      // Reset instance
      (SupabaseQuestionDatabase as any).instance = null;
      const db = SupabaseQuestionDatabase.getInstance();
      
      const question: GeneratedQuestion = {
        question: 'Test question?',
        correctAnswer: 'Test answer',
        acceptableAnswers: ['test answer', 'Test Answer'],
        category: 'Test',
        difficulty: 1
      };

      const result = await db.storeQuestion('test-topic', 1, question);
      assert.strictEqual(result, false);
    });
  });

  describe('getQuestions', () => {
    it('should return empty array when database is not available', async () => {
      const questions = await database.getQuestions('test-topic', 1, 5);
      assert.deepStrictEqual(questions, []);
    });
  });

  describe('getStats', () => {
    it('should return default stats when database is not available', async () => {
      const stats = await database.getStats();
      assert.deepStrictEqual(stats, {
        totalQuestions: 0,
        topicCount: 0,
        avgUsagePerQuestion: 0
      });
    });
  });

  describe('hasEnoughQuestions', () => {
    it('should return false when database is not available', async () => {
      const hasEnough = await database.hasEnoughQuestions('test-topic', 1, 5);
      assert.strictEqual(hasEnough, false);
    });
  });

  describe('getAvailableTopics', () => {
    it('should return empty array when database is not available', async () => {
      const topics = await database.getAvailableTopics();
      assert.deepStrictEqual(topics, []);
    });
  });

  describe('getAllQuestions', () => {
    it('should return empty array when database is not available', async () => {
      const questions = await database.getAllQuestions(10);
      assert.deepStrictEqual(questions, []);
    });
  });

  describe('searchQuestions', () => {
    it('should return empty array when database is not available', async () => {
      const questions = await database.searchQuestions('test', 10);
      assert.deepStrictEqual(questions, []);
    });
  });

  describe('close', () => {
    it('should handle close gracefully', () => {
      // Should not throw any errors
      assert.doesNotThrow(() => {
        database.close();
      });
    });
  });
}); 