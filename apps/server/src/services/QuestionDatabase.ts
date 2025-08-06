import Database from 'better-sqlite3';
import path from 'path';
import { GeneratedQuestion } from './GeminiService';

export interface StoredQuestion {
  id: number;
  topic: string;
  difficulty: number;
  question: string;
  correctAnswer: string;
  acceptableAnswers: string; // JSON string of array
  category: string;
  createdAt: string;
  usedCount: number;
}

export class QuestionDatabase {
  private db: Database.Database | null;
  private static instance: QuestionDatabase;

  private constructor() {
    try {
      // Create database in the server directory
      const dbPath = path.join(process.cwd(), 'questions.db');
      this.db = new Database(dbPath);
      
      // Enable WAL mode for better performance
      this.db.pragma('journal_mode = WAL');
      
      this.initializeDatabase();
      
      console.log('📊 Question database initialized successfully');
    } catch (error) {
      console.warn('⚠️ Question database initialization failed, running without caching:', error instanceof Error ? error.message : String(error));
      this.db = null;
    }
  }

  public static getInstance(): QuestionDatabase {
    if (!QuestionDatabase.instance) {
      QuestionDatabase.instance = new QuestionDatabase();
    }
    return QuestionDatabase.instance;
  }

  private initializeDatabase(): void {
    if (!this.db) return;
    
    // Create questions table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topic TEXT NOT NULL,
        difficulty INTEGER NOT NULL,
        question TEXT NOT NULL UNIQUE,
        correctAnswer TEXT NOT NULL,
        acceptableAnswers TEXT NOT NULL,
        category TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        usedCount INTEGER DEFAULT 0
      )
    `;

    this.db.exec(createTableQuery);

    // Create index for efficient lookups
    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_topic_difficulty 
      ON questions(topic, difficulty)
    `;

    this.db.exec(createIndexQuery);
  }

  /**
   * Store a newly generated question in the database
   */
  public async storeQuestion(topic: string, difficulty: number, question: GeneratedQuestion): Promise<boolean> {
    if (!this.db) return false;
    
    try {
      const insertQuery = `
        INSERT INTO questions (topic, difficulty, question, correctAnswer, acceptableAnswers, category)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const acceptableAnswersJson = JSON.stringify(question.acceptableAnswers);

      const stmt = this.db.prepare(insertQuery);
      const result = stmt.run(
        topic,
        difficulty,
        question.question,
        question.correctAnswer,
        acceptableAnswersJson,
        question.category
      );

      console.log(`💾 Stored question in database: "${question.question}" (ID: ${result.lastInsertRowid})`);
      return true;

    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        console.log(`⚠️ Question already exists in database: "${question.question}"`);
        return false;
      }
      console.error('Failed to store question in database:', error);
      return false;
    }
  }

  /**
   * Retrieve questions from database for a specific topic and difficulty
   */
  public async getQuestions(topic: string, difficulty: number, limit: number = 10): Promise<GeneratedQuestion[]> {
    if (!this.db) return [];
    
    try {
      const selectQuery = `
        SELECT * FROM questions 
        WHERE topic = ? AND difficulty = ?
        ORDER BY usedCount ASC, RANDOM()
        LIMIT ?
      `;

      const stmt = this.db.prepare(selectQuery);
      const rows = stmt.all(topic, difficulty, limit) as StoredQuestion[];

      const questions: GeneratedQuestion[] = rows.map(row => ({
        question: row.question,
        correctAnswer: row.correctAnswer,
        acceptableAnswers: JSON.parse(row.acceptableAnswers),
        category: row.category,
        difficulty: row.difficulty
      }));

      if (questions.length > 0) {
        console.log(`📤 Retrieved ${questions.length} questions from database for "${topic}" (difficulty: ${difficulty})`);
      }

      return questions;

    } catch (error) {
      console.error('Failed to retrieve questions from database:', error);
      return [];
    }
  }

  /**
   * Mark a question as used (increment usage count)
   */
  public async markQuestionAsUsed(questionText: string): Promise<void> {
    if (!this.db) return;
    
    try {
      const updateQuery = `
        UPDATE questions 
        SET usedCount = usedCount + 1 
        WHERE question = ?
      `;

      const stmt = this.db.prepare(updateQuery);
      stmt.run(questionText);

    } catch (error) {
      console.error('Failed to mark question as used:', error);
    }
  }

  /**
   * Get database statistics
   */
  public async getStats(): Promise<{ totalQuestions: number; topicCount: number; avgUsagePerQuestion: number }> {
    if (!this.db) return { totalQuestions: 0, topicCount: 0, avgUsagePerQuestion: 0 };
    
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as totalQuestions,
          COUNT(DISTINCT topic) as topicCount,
          AVG(usedCount) as avgUsagePerQuestion
        FROM questions
      `;

      const stmt = this.db.prepare(statsQuery);
      const result = stmt.get() as any;

      return {
        totalQuestions: result.totalQuestions || 0,
        topicCount: result.topicCount || 0,
        avgUsagePerQuestion: Math.round((result.avgUsagePerQuestion || 0) * 100) / 100
      };

    } catch (error) {
      console.error('Failed to get database stats:', error);
      return { totalQuestions: 0, topicCount: 0, avgUsagePerQuestion: 0 };
    }
  }

  /**
   * Clean up database connection
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      console.log('📊 Question database connection closed');
    }
  }

  /**
   * Check if we have enough questions for a topic/difficulty combination
   */
  public async hasEnoughQuestions(topic: string, difficulty: number, minRequired: number = 5): Promise<boolean> {
    if (!this.db) return false;
    
    try {
      const countQuery = `
        SELECT COUNT(*) as count 
        FROM questions 
        WHERE topic = ? AND difficulty = ?
      `;

      const stmt = this.db.prepare(countQuery);
      const result = stmt.get(topic, difficulty) as { count: number };

      return result.count >= minRequired;

    } catch (error) {
      console.error('Failed to check question count:', error);
      return false;
    }
  }

  /**
   * Get a list of all unique topic/difficulty combinations in the database
   */
  public async getAvailableTopics(): Promise<Array<{ topic: string; difficulty: number; count: number }>> {
    if (!this.db) return [];
    
    try {
      const topicsQuery = `
        SELECT topic, difficulty, COUNT(*) as count
        FROM questions
        GROUP BY topic, difficulty
        ORDER BY topic, difficulty
      `;

      const stmt = this.db.prepare(topicsQuery);
      const results = stmt.all() as Array<{ topic: string; difficulty: number; count: number }>;

      return results;

    } catch (error) {
      console.error('Failed to get available topics:', error);
      return [];
    }
  }

  /**
   * Get all questions for debugging/admin purposes
   */
  public async getAllQuestions(limit: number = 100): Promise<StoredQuestion[]> {
    if (!this.db) return [];
    
    try {
      const allQuestionsQuery = `
        SELECT * FROM questions
        ORDER BY createdAt DESC
        LIMIT ?
      `;

      const stmt = this.db.prepare(allQuestionsQuery);
      const results = stmt.all(limit) as StoredQuestion[];

      return results;

    } catch (error) {
      console.error('Failed to get all questions:', error);
      return [];
    }
  }

  /**
   * Search questions by text
   */
  public async searchQuestions(searchTerm: string, limit: number = 50): Promise<StoredQuestion[]> {
    if (!this.db) return [];
    
    try {
      const searchQuery = `
        SELECT * FROM questions
        WHERE question LIKE ? OR correctAnswer LIKE ?
        ORDER BY createdAt DESC
        LIMIT ?
      `;

      const searchPattern = `%${searchTerm}%`;
      const stmt = this.db.prepare(searchQuery);
      const results = stmt.all(searchPattern, searchPattern, limit) as StoredQuestion[];

      return results;

    } catch (error) {
      console.error('Failed to search questions:', error);
      return [];
    }
  }
} 