import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GeneratedQuestion, QuestionImageMetadata } from './GeminiService';
import { QuestionIdentifier } from './questionTypes';
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

  private static slugify(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-|-$/g, '');
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
          image: normalizedImage,
          round_time_ms: typeof question.roundTimeMs === 'number' ? Math.max(0, Math.floor(question.roundTimeMs)) : null
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
   * Attach multiple tags to a question by id using RPC.
   * Accepts free-form labels or slugs; server resolves/creates tags.
   */
  public async attachTagsToQuestion(questionId: number, tags: string[]): Promise<{ tag_id: number; slug: string; display_name: string; }[] | null> {
    if (!this.client) return null;
    try {
      const inputs = (tags || []).filter(Boolean);
      const { data, error } = await this.client.rpc('attach_tags_to_question', {
        question_id: questionId,
        tag_slugs: inputs,
      });
      if (error) throw error;
      return (data || []) as { tag_id: number; slug: string; display_name: string; }[];
    } catch (error) {
      console.error('Failed to attach tags via Supabase RPC:', error);
      return null;
    }
  }

  /** Search questions by multiple tags (OR/AND) using RPC */
  public async searchQuestionsByTags(
    tags: string[],
    opts?: { requireAll?: boolean; includeDescendants?: boolean; limit?: number }
  ): Promise<GeneratedQuestion[]> {
    if (!this.client) return [];
    const requireAll = !!opts?.requireAll;
    const includeDescendants = !!opts?.includeDescendants;
    const limit = Math.max(1, opts?.limit ?? 10);
    try {
      const inputs = (tags || []).map(t => t ?? '').filter(t => t.trim().length > 0);
      const { data, error } = await this.client.rpc('search_questions_by_tags', {
        tag_slugs: inputs,
        require_all: requireAll,
        include_descendants: includeDescendants,
        limit_count: limit,
      });
      if (error) throw error;
      const rows = (data || []) as any[];
      return rows.map(row => {
        const acceptableField = row.acceptable_answers;
        let acceptableAnswers: string[] = [];
        if (Array.isArray(acceptableField)) {
          acceptableAnswers = acceptableField.filter((a: unknown): a is string => typeof a === 'string');
        } else if (typeof acceptableField === 'string') {
          try {
            const parsed = JSON.parse(acceptableField);
            if (Array.isArray(parsed)) acceptableAnswers = parsed.filter((a: unknown): a is string => typeof a === 'string');
          } catch {}
        } else if (acceptableField && typeof acceptableField === 'object') {
          acceptableAnswers = Object.values(acceptableField).filter((a): a is string => typeof a === 'string');
        }
        return {
          questionId: row.id,
          question: row.question,
          correctAnswer: row.correct_answer,
          acceptableAnswers,
          category: row.category,
          difficulty: row.difficulty,
          image: this.normalizeImageMetadata(row.image),
          roundTimeMs: typeof row.round_time_ms === 'number' ? row.round_time_ms : undefined,
          sourceTopic: row.topic ?? undefined,
        };
      });
    } catch (error) {
      console.error('searchQuestionsByTags RPC failed:', error);
      return [];
    }
  }

  /**
   * Retrieve questions by topic using tag-based RPC.
   * Note: difficulty is deprecated and ignored in Supabase.
   */
  public async getQuestions(topic: string, difficulty: number, limit: number = 10): Promise<GeneratedQuestion[]> {
    if (!this.client) return [];

    try {
      // Use tag RPC so a question can belong to multiple topics
      const slug = SupabaseQuestionDatabase.slugify(topic || '');
      const rpcParams: Record<string, any> = {
        // Provide both canonical slug and raw label to maximize match success
        tag_slugs: slug ? [slug, topic] : [topic],
        require_all: true,
        include_descendants: false,
        limit_count: limit,
      };

      const { data, error } = await this.client.rpc('search_questions_by_tags', rpcParams);

      if (error) {
        throw error;
      }

      const rows = (data || []) as any[];
      let questions: GeneratedQuestion[] = rows.map(row => {
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
          questionId: row.id,
          question: row.question,
          correctAnswer: row.correct_answer,
          acceptableAnswers,
          category: row.category,
          difficulty: row.difficulty,
          image: this.normalizeImageMetadata(row.image),
          roundTimeMs: typeof row.round_time_ms === 'number' ? row.round_time_ms : undefined,
          sourceTopic: row.topic ?? undefined
        };
      });

      if (questions.length > 0) {
        console.log(`📤 Retrieved ${questions.length} questions from Supabase via tags for "${topic}" (difficulty ignored: ${difficulty})`);
        return questions;
      }

      // If RPC returned zero rows, fall back to legacy topic+difficulty query
      console.log(`ℹ️ No tag matches for "${topic}" via RPC; falling back to legacy query.`);
      const { data: fallback, error: fbErr } = await this.client
        .from('questions')
        .select('*')
        .eq('topic', topic)
        .eq('difficulty', difficulty)
        .order('used_count', { ascending: true })
        .limit(limit);

      if (fbErr) throw fbErr;

      questions = (fallback || []).map((row: any) => {
        const acceptableField = row.acceptable_answers;
        let acceptableAnswers: string[] = [];

        if (Array.isArray(acceptableField)) {
          acceptableAnswers = acceptableField.filter((answer: unknown): answer is string => typeof answer === 'string');
        } else if (typeof acceptableField === 'string') {
          try {
            const parsed = JSON.parse(acceptableField);
            if (Array.isArray(parsed)) {
              acceptableAnswers = parsed.filter((answer: unknown): answer is string => typeof answer === 'string');
            }
          } catch (parseError) {
            console.warn('⚠️ Failed to parse acceptable_answers JSON from Supabase row (fallback):', parseError);
          }
        }

        if (acceptableAnswers.length === 0 && typeof acceptableField === 'object' && acceptableField !== null) {
          acceptableAnswers = Object.values(acceptableField).filter((answer): answer is string => typeof answer === 'string');
        }

        return {
          questionId: row.id,
          question: row.question,
          correctAnswer: row.correct_answer,
          acceptableAnswers,
          category: row.category,
          difficulty: row.difficulty,
          image: this.normalizeImageMetadata(row.image),
          roundTimeMs: typeof row.round_time_ms === 'number' ? row.round_time_ms : undefined,
          sourceTopic: row.topic ?? undefined,
        };
      });

      if (questions.length > 0) {
        console.log(`📤 Retrieved ${questions.length} questions from Supabase (fallback) for "${topic}" (difficulty: ${difficulty})`);
      }

      return questions;

    } catch (error) {
      // Fallback to legacy topic+difficulty query if RPC is unavailable
      try {
        const { data: fallback, error: fbErr } = await this.client
          .from('questions')
          .select('*')
          .eq('topic', topic)
          .eq('difficulty', difficulty)
          .order('used_count', { ascending: true })
          .limit(limit);

        if (fbErr) throw fbErr;

        const questions: GeneratedQuestion[] = (fallback || []).map((row: any) => {
          const acceptableField = row.acceptable_answers;
          let acceptableAnswers: string[] = [];

          if (Array.isArray(acceptableField)) {
            acceptableAnswers = acceptableField.filter((answer: unknown): answer is string => typeof answer === 'string');
          } else if (typeof acceptableField === 'string') {
            try {
              const parsed = JSON.parse(acceptableField);
              if (Array.isArray(parsed)) {
                acceptableAnswers = parsed.filter((answer: unknown): answer is string => typeof answer === 'string');
              }
            } catch (parseError) {
              console.warn('⚠️ Failed to parse acceptable_answers JSON from Supabase row (fallback):', parseError);
            }
          }

          if (acceptableAnswers.length === 0 && typeof acceptableField === 'object' && acceptableField !== null) {
            acceptableAnswers = Object.values(acceptableField).filter((answer): answer is string => typeof answer === 'string');
          }

          return {
            questionId: row.id,
            question: row.question,
            correctAnswer: row.correct_answer,
            acceptableAnswers,
            category: row.category,
            difficulty: row.difficulty,
            image: this.normalizeImageMetadata(row.image),
            roundTimeMs: typeof row.round_time_ms === 'number' ? row.round_time_ms : undefined,
            sourceTopic: row.topic ?? undefined,
          };
        });

        if (questions.length > 0) {
          console.log(`📤 Retrieved ${questions.length} questions from Supabase (fallback) for "${topic}" (difficulty: ${difficulty})`);
        }
        return questions;
      } catch (fbError) {
        console.error('Failed to retrieve questions from Supabase (RPC and fallback):', fbError);
        return [];
      }
    }
  }

  /**
   * Mark a question as used (increment usage count)
   */
  public async markQuestionAsUsed(identifier: QuestionIdentifier): Promise<void> {
    if (!this.client) return;
    
    try {
      let targetId = identifier.id;
      let currentUsedCount = 0;

      if (targetId !== undefined && targetId !== null && `${targetId}`.trim().length > 0) {
        const { data, error } = await this.client
          .from('questions')
          .select('id, used_count')
          .eq('id', targetId)
          .single();

        if (error) throw error;
        if (!data) return;

        targetId = data.id;
        currentUsedCount = data.used_count || 0;
      } else {
        const { data, error } = await this.client
          .from('questions')
          .select('id, used_count')
          .eq('question', identifier.question)
          .order('id', { ascending: true })
          .limit(1);

        if (error) throw error;

        const record = data?.[0];
        if (!record) return;

        targetId = record.id;
        currentUsedCount = record.used_count || 0;
      }

      if (targetId === undefined || targetId === null) return;

      const { error: updateError } = await this.client
        .from('questions')
        .update({ used_count: currentUsedCount + 1 })
        .eq('id', targetId);

      if (updateError) {
        throw updateError;
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
      const slug = SupabaseQuestionDatabase.slugify(topic || '');
      const rpcParams: Record<string, any> = {
        tag_slugs: slug ? [slug, topic] : [topic],
        require_all: true,
        include_descendants: false,
        limit_count: Math.max(1, minRequired),
      };

      const { data, error } = await this.client.rpc('search_questions_by_tags', rpcParams);
      if (error) throw error;

      const rows = (data || []) as any[];
      if (rows.length >= minRequired) return true;

      // Fallback to legacy count when RPC yields insufficient results
      const { count, error: fbErr } = await this.client
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('topic', topic)
        .eq('difficulty', difficulty);
      if (fbErr) throw fbErr;
      return (count || 0) >= minRequired;
    } catch (error) {
      // Fallback to legacy count
      try {
        const { count, error: fbErr } = await this.client
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('topic', topic)
          .eq('difficulty', difficulty);
        if (fbErr) throw fbErr;
        return (count || 0) >= minRequired;
      } catch (fbError) {
        console.error('Failed to check question availability in Supabase (RPC and fallback):', fbError);
        return false;
      }
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
      const maxRows = Number(process.env.POPULAR_TOPICS_SCAN_LIMIT ?? '10000');
      const pageSize = Math.min(maxRows, Number(process.env.POPULAR_TOPICS_PAGE_SIZE ?? '1000'));
      const topicMap = new Map<string, { questionCount: number; totalUsedCount: number }>();

      let offset = 0;
      let totalFetched = 0;

      while (offset < maxRows) {
        const upperBound = Math.min(offset + pageSize - 1, maxRows - 1);
        const { data, error } = await this.client
          .from('questions')
          .select('topic, used_count')
          .not('topic', 'is', null)
          .not('topic', 'eq', '')
          .range(offset, upperBound);

        if (error) {
          throw error;
        }

        const rows = data || [];
        totalFetched += rows.length;

        rows.forEach((row: any) => {
          const topic: string = row.topic;
          const usedCount: number = row.used_count || 0;
          const entry = topicMap.get(topic) || { questionCount: 0, totalUsedCount: 0 };
          entry.questionCount += 1;
          entry.totalUsedCount += usedCount;
          topicMap.set(topic, entry);
        });

        if (rows.length < pageSize) {
          break;
        }

        offset += pageSize;
      }

      if (totalFetched >= maxRows) {
        console.warn(
          `⚠️ popular topics scan fetched ${totalFetched} rows (limit ${maxRows}). ` +
          'Increase POPULAR_TOPICS_SCAN_LIMIT to capture additional data if needed.'
        );
      }

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
