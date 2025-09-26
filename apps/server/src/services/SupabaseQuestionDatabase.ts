import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GeneratedQuestion, QuestionImageMetadata } from './GeminiService';
import { getDatabaseConfig } from '../config';

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
  image?: QuestionImageMetadata | null;
}

export class SupabaseQuestionDatabase {
  private client: SupabaseClient | null;
  private static instance: SupabaseQuestionDatabase;

  private constructor() {
    try {
      const config = getDatabaseConfig();
      
      if (config.type !== 'supabase' || !config.supabase) {
        throw new Error('Supabase configuration not found');
      }

      this.client = createClient(config.supabase.url, config.supabase.anonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      console.log('📊 Supabase question database initialized successfully');
    } catch (error) {
      console.warn('⚠️ Supabase question database initialization failed, running without caching:', error instanceof Error ? error.message : String(error));
      this.client = null;
    }
  }

  public static getInstance(): SupabaseQuestionDatabase {
    if (!SupabaseQuestionDatabase.instance) {
      SupabaseQuestionDatabase.instance = new SupabaseQuestionDatabase();
    }
    return SupabaseQuestionDatabase.instance;
  }

  /**
   * Store a newly generated question in the database
   */
  public async storeQuestion(topic: string, difficulty: number, question: GeneratedQuestion): Promise<boolean> {
    if (!this.client) return false;
    
    try {
      const normalizedImage = this.normalizeImageMetadata(question.image);

      const { data, error } = await this.client
        .from('questions')
        .insert({
          topic,
          difficulty,
          question: question.question,
          correct_answer: question.correctAnswer,
          acceptable_answers: question.acceptableAnswers,
          category: question.category,
          used_count: 0,
          image: normalizedImage
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`⚠️ Question already exists in database: "${question.question}"`);
          return false;
        }
        throw error;
      }

      console.log(`💾 Stored question in Supabase: "${question.question}" (ID: ${data.id})`);
      return true;

    } catch (error) {
      console.error('Failed to store question in Supabase:', error);
      return false;
    }
  }

  /**
   * Retrieve questions from database for a specific topic and difficulty
   */
  public async getQuestions(topic: string, difficulty: number, limit: number = 10): Promise<GeneratedQuestion[]> {
    if (!this.client) return [];
    
    try {
      const { data, error } = await this.client
        .from('questions')
        .select('*')
        .eq('topic', topic)
        .eq('difficulty', difficulty)
        .order('used_count', { ascending: true })
        .limit(limit);

      if (error) {
        throw error;
      }

      const questions: GeneratedQuestion[] = (data || []).map(row => {
        const acceptableField = row.acceptable_answers;
        let acceptableAnswers: string[] = [];

        if (Array.isArray(acceptableField)) {
          acceptableAnswers = acceptableField.filter((answer): answer is string => typeof answer === 'string');
        } else if (typeof acceptableField === 'string') {
          try {
            const parsed = JSON.parse(acceptableField);
            if (Array.isArray(parsed)) {
              acceptableAnswers = parsed.filter((answer): answer is string => typeof answer === 'string');
            }
          } catch (parseError) {
            console.warn('⚠️ Failed to parse acceptable_answers JSON from Supabase row:', parseError);
          }
        }

        if (acceptableAnswers.length === 0 && typeof acceptableField === 'object' && acceptableField !== null) {
          acceptableAnswers = Object.values(acceptableField).filter((answer): answer is string => typeof answer === 'string');
        }

        return {
          question: row.question,
          correctAnswer: row.correct_answer,
          acceptableAnswers,
          category: row.category,
          difficulty: row.difficulty,
          image: this.normalizeImageMetadata(row.image),
          sourceTopic: row.topic ?? undefined
        };
      });

      if (questions.length > 0) {
        console.log(`📤 Retrieved ${questions.length} questions from Supabase for "${topic}" (difficulty: ${difficulty})`);
      }

      return questions;

    } catch (error) {
      console.error('Failed to retrieve questions from Supabase:', error);
      return [];
    }
  }

  /**
   * Mark a question as used (increment usage count)
   */
  public async markQuestionAsUsed(questionText: string): Promise<void> {
    if (!this.client) return;
    
    try {
      // First get the current used_count
      const { data: currentData, error: selectError } = await this.client
        .from('questions')
        .select('used_count')
        .eq('question', questionText)
        .single();

      if (selectError) {
        throw selectError;
      }

      if (currentData) {
        // Update with incremented value
        const { error: updateError } = await this.client
          .from('questions')
          .update({ used_count: (currentData.used_count || 0) + 1 })
          .eq('question', questionText);

        if (updateError) {
          throw updateError;
        }
      }

    } catch (error) {
      console.error('Failed to mark question as used in Supabase:', error);
    }
  }

  /**
   * Get database statistics
   */
  public async getStats(): Promise<{ totalQuestions: number; topicCount: number; avgUsagePerQuestion: number }> {
    if (!this.client) return { totalQuestions: 0, topicCount: 0, avgUsagePerQuestion: 0 };
    
    try {
      // Get total questions count
      const { count: totalQuestions, error: countError } = await this.client
        .from('questions')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      // Get unique topics count
      const { data: topics, error: topicsError } = await this.client
        .from('questions')
        .select('topic')
        .not('topic', 'is', null);

      if (topicsError) throw topicsError;

      const topicCount = new Set(topics?.map(t => t.topic) || []).size;

      // Get average usage per question
      const { data: avgData, error: avgError } = await this.client
        .from('questions')
        .select('used_count');

      if (avgError) throw avgError;

      const avgUsagePerQuestion = avgData && avgData.length > 0 
        ? avgData.reduce((sum, row) => sum + (row.used_count || 0), 0) / avgData.length
        : 0;

      return {
        totalQuestions: totalQuestions || 0,
        topicCount,
        avgUsagePerQuestion: Math.round(avgUsagePerQuestion * 100) / 100
      };

    } catch (error) {
      console.error('Failed to get Supabase database stats:', error);
      return { totalQuestions: 0, topicCount: 0, avgUsagePerQuestion: 0 };
    }
  }

  /**
   * Clean up database connection
   */
  public close(): void {
    // Supabase client doesn't need explicit cleanup
    console.log('📊 Supabase question database connection closed');
  }

  /**
   * Check if we have enough questions for a topic/difficulty combination
   */
  public async hasEnoughQuestions(topic: string, difficulty: number, minRequired: number = 5): Promise<boolean> {
    if (!this.client) return false;
    
    try {
      const { count, error } = await this.client
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('topic', topic)
        .eq('difficulty', difficulty);

      if (error) {
        throw error;
      }

      return (count || 0) >= minRequired;

    } catch (error) {
      console.error('Failed to check question count in Supabase:', error);
      return false;
    }
  }

  /**
   * Get a list of all unique topic/difficulty combinations in the database
   */
  public async getAvailableTopics(): Promise<Array<{ topic: string; difficulty: number; count: number }>> {
    if (!this.client) return [];
    
    try {
      const { data, error } = await this.client
        .from('questions')
        .select('topic, difficulty')
        .not('topic', 'is', null);

      if (error) {
        throw error;
      }

      // Group by topic and difficulty, count occurrences
      const topicMap = new Map<string, Map<number, number>>();
      
      data?.forEach(row => {
        const topic = row.topic;
        const difficulty = row.difficulty;
        
        if (!topicMap.has(topic)) {
          topicMap.set(topic, new Map());
        }
        
        const difficultyMap = topicMap.get(topic)!;
        difficultyMap.set(difficulty, (difficultyMap.get(difficulty) || 0) + 1);
      });

      // Convert to array format
      const results: Array<{ topic: string; difficulty: number; count: number }> = [];
      
      for (const [topic, difficultyMap] of topicMap) {
        for (const [difficulty, count] of difficultyMap) {
          results.push({ topic, difficulty, count });
        }
      }

      return results.sort((a, b) => {
        if (a.topic !== b.topic) return a.topic.localeCompare(b.topic);
        return a.difficulty - b.difficulty;
      });

    } catch (error) {
      console.error('Failed to get available topics from Supabase:', error);
      return [];
    }
  }

  /**
   * Get all questions for debugging/admin purposes
   */
  public async getAllQuestions(limit: number = 100): Promise<StoredQuestion[]> {
    if (!this.client) return [];
    
    try {
      const { data, error } = await this.client
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('Failed to get all questions from Supabase:', error);
      return [];
    }
  }

  /**
   * Search questions by text
   */
  public async searchQuestions(searchTerm: string, limit: number = 50): Promise<StoredQuestion[]> {
    if (!this.client) return [];
    
    try {
      const { data, error } = await this.client
        .from('questions')
        .select('*')
        .or(`question.ilike.%${searchTerm}%,correct_answer.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('Failed to search questions in Supabase:', error);
      return [];
    }
  }

  /**
   * Get most popular topics based on aggregate used_count and availability
   */
  public async getPopularTopics(limit: number = 50): Promise<Array<{ topic: string; questionCount: number; totalUsedCount: number }>> {
    if (!this.client) return [];

    try {
      const { data, error } = await this.client
        .from('questions')
        .select('topic, used_count')
        .not('topic', 'is', null);

      if (error) {
        throw error;
      }

      const topicMap = new Map<string, { questionCount: number; totalUsedCount: number }>();
      (data || []).forEach((row: any) => {
        const topic: string = row.topic;
        const usedCount: number = row.used_count || 0;
        const entry = topicMap.get(topic) || { questionCount: 0, totalUsedCount: 0 };
        entry.questionCount += 1;
        entry.totalUsedCount += usedCount;
        topicMap.set(topic, entry);
      });

      const results = Array.from(topicMap.entries()).map(([topic, agg]) => ({
        topic,
        questionCount: agg.questionCount,
        totalUsedCount: agg.totalUsedCount,
      }));

      results.sort((a, b) => {
        if (b.questionCount !== a.questionCount) return b.questionCount - a.questionCount;
        return a.topic.localeCompare(b.topic);
      });

      return results.slice(0, limit);
    } catch (error) {
      console.error('Failed to get popular topics from Supabase:', error);
      return [];
    }
  }

  private normalizeImageMetadata(image: unknown): QuestionImageMetadata | null {
    if (!image || typeof image !== 'object') {
      return null;
    }

    const record = image as Record<string, unknown>;
    const rawUrl = record.url;
    if (typeof rawUrl !== 'string') {
      return null;
    }

    const url = rawUrl.trim();
    if (!url) {
      return null;
    }

    const toStringOrUndefined = (value: unknown): string | undefined => {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed ? trimmed : undefined;
      }
      return undefined;
    };

    const toNumberOrUndefined = (value: unknown): number | undefined => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string') {
        const parsed = Number.parseFloat(value);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
      return undefined;
    };

    const normalized: QuestionImageMetadata = { url };

    const altText = toStringOrUndefined(record.altText);
    if (altText) normalized.altText = altText;

    const attribution = toStringOrUndefined(record.attribution);
    if (attribution) normalized.attribution = attribution;

    const source = toStringOrUndefined(record.source);
    if (source) normalized.source = source;

    const mime = toStringOrUndefined(record.mime);
    if (mime) normalized.mime = mime;

    const originalUrl = toStringOrUndefined(record.original_url);
    if (originalUrl) normalized.original_url = originalUrl;

    const storageKey = toStringOrUndefined(record.storage_key);
    if (storageKey) normalized.storage_key = storageKey;

    const width = toNumberOrUndefined(record.width);
    if (typeof width === 'number') normalized.width = width;

    const height = toNumberOrUndefined(record.height);
    if (typeof height === 'number') normalized.height = height;

    return normalized;
  }
}
