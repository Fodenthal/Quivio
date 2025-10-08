import { GeneratedQuestion, GeminiService } from "../../../services/GeminiService";
import { TriviaRoomState } from "../../schema/TriviaRoomState";

/**
 * Manages in-memory question buffering and background refills.
 *
 * Invariants:
 * - Maintains an in-memory buffer of size ≤ questionBufferSize.
 * - Tracks a capped list of recent question texts to avoid repeats (max 50).
 *
 * Side effects:
 * - May persist newly generated questions to the database.
 * - May increment used_count for served questions.
 *
 * This class does not mutate unrelated room state. It only reads topic/difficulty
 * from the provided state to determine what to fetch/generate next, and updates
 * state.currentTopic/currentTopicIndex to preserve the existing round-robin behavior.
 */
export class QuestionBufferManager {
  private readonly questionBufferSize: number;
  private readonly state: TriviaRoomState;
  private readonly geminiService: GeminiService;
  private readonly questionDatabase: any;
  private readonly log: (message?: any, ...optional: any[]) => void;

  private questionBuffer: GeneratedQuestion[] = [];
  private topicRecentQuestions: Map<string, string[]> = new Map(); // Track recent questions per topic
  private topicQueries: Map<string, string[]> = new Map(); // Track search queries per topic
  private topicAnswers: Map<string, string[]> = new Map(); // Track previous answers per topic
  private topicRawResponses: Map<string, string[]> = new Map(); // Track raw fact-gathering responses per topic

  // NEW: Topic pool system for large batch management
  private topicQuestionPools: Map<string, GeneratedQuestion[]> = new Map(); // Large pools per topic
  private topicLoadPromises: Map<string, Promise<void>> = new Map(); // Track in-flight loads to avoid duplicates
  private refillMutex: Promise<void> = Promise.resolve(); // Single mutex for all refill operations
  // RR fairness: index independent of this.currentTopicIndex
  private rrIndex = 0;

  // Configuration constants
  private readonly TOPIC_POOL_SIZE = 50; // Large batch size for database fetching

  /**
   * @param params.state Room state used for topic/difficulty and round-robin updates
   * @param params.geminiService Question generator
   * @param params.questionDatabase Persistent question store (Supabase-backed)
   * @param params.questionBufferSize Desired buffer size (default: 2)
   * @param params.logger Optional logger; defaults to console.log
   */
  constructor(params: {
    state: TriviaRoomState;
    geminiService: GeminiService;
    questionDatabase: any;
    questionBufferSize?: number;
    logger?: (message?: any, ...optional: any[]) => void;
  }) {
    this.state = params.state;
    this.geminiService = params.geminiService;
    this.questionDatabase = params.questionDatabase;
    this.questionBufferSize = params.questionBufferSize ?? 2;
    this.log = params.logger ?? console.log;
  }

  /**
   * Clears the in-memory buffer and generation flag. Does not change topics.
   */
  clear(): void {
    this.questionBuffer = [];
    this.log("🗑️ Question buffer cleared");
  }

  /**
   * Get previous search queries for a specific topic.
   * @param topic - The topic to get queries for
   * @returns Array of previous search queries for this topic
   */
  private getTopicQueries(topic: string): string[] {
    return this.topicQueries.get(topic) || [];
  }

  /**
   * Get previous answers for a specific topic.
   * @param topic - The topic to get previous answers for
   * @returns Array of previous answers for this topic
   */
  private getTopicAnswers(topic: string): string[] {
    return this.topicAnswers.get(topic) || [];
  }

  /**
   * Get previous raw fact-gathering responses for a specific topic.
   * @param topic - The topic to get previous raw responses for
   * @returns Array of previous raw responses for this topic
   */
  private getTopicRawResponses(topic: string): string[] {
    return this.topicRawResponses.get(topic) || [];
  }

  /**
   * Add an answer to a topic's previous answers history.
   * @param topic - The topic to add the answer to
   * @param answer - The answer text to add
   */
  private addTopicAnswer(topic: string, answer: string): void {
    if (!answer || answer.trim().length === 0) return;
    
    const answers = this.getTopicAnswers(topic);
    answers.push(answer.trim());
    
    // No artificial cap - natural session length limits growth
    this.topicAnswers.set(topic, answers);
    this.log(`📝 Added answer to topic "${topic}": "${answer}" (${answers.length} total)`);
  }

  /**
   * Add a raw fact-gathering response to a topic's history for similarity detection.
   * @param topic - The topic to add the raw response to
   * @param rawResponse - The raw fact-gathering response text to add
   */
  private addTopicRawResponse(topic: string, rawResponse: string): void {
    if (!rawResponse || rawResponse.trim().length === 0) return;
    
    const rawResponses = this.getTopicRawResponses(topic);
    rawResponses.push(rawResponse.trim());
    
    // Cap at reasonable limit to prevent memory bloat
    const MAX_RAW_RESPONSES = 10;
    if (rawResponses.length > MAX_RAW_RESPONSES) {
      rawResponses.shift(); // Remove oldest
    }
    
    this.topicRawResponses.set(topic, rawResponses);
    this.log(`🔍 Added raw response to topic "${topic}" (${rawResponses.length} total, ${rawResponse.length} chars)`);
  }

  /**
   * Add a search query to a topic's query history.
   * @param topic - The topic to add the query to
   * @param query - The search query to add
   */
  private addTopicQuery(topic: string, query: string): void {
    if (!query || query.trim().length === 0) return;
    
    const queries = this.getTopicQueries(topic);
    queries.push(query.trim());
    
    // No artificial cap - natural session length limits growth
    this.topicQueries.set(topic, queries);
    this.log(`📝 Added query to topic "${topic}": "${query}" (${queries.length} total)`);
  }

  /**
   * Get recent questions for a specific topic.
   * @param topic - The topic to get recent questions for
   * @returns Array of recent questions for this topic
   */
  private getTopicRecentQuestions(topic: string): string[] {
    return this.topicRecentQuestions.get(topic) || [];
  }

  /**
   * Add a question to a topic's recent questions history.
   * @param topic - The topic to add the question to
   * @param question - The question text to add
   */
  private addTopicRecentQuestion(topic: string, question: string): void {
    if (!question || question.trim().length === 0) return;
    
    const questions = this.getTopicRecentQuestions(topic);
    questions.push(question.trim());
    
    // No artificial cap - natural session length limits growth
    this.topicRecentQuestions.set(topic, questions);
    this.log(`📝 Added question to topic "${topic}" recent history (${questions.length} questions)`);
  }

  /**
   * Clears the recent questions list to allow questions to repeat after topic changes.
   */
  resetRecents(): void {
    this.topicRecentQuestions.clear();
    this.topicQueries.clear();
    this.topicAnswers.clear();
    this.topicRawResponses.clear();
    this.log("🗑️ Cleared all topic recent questions, search queries, answers, and raw responses");
  }

  /**
   * Clear recent questions and queries for a specific topic.
   * @param topic - The topic to clear
   */
  clearTopicHistory(topic: string): void {
    const hadQuestions = this.topicRecentQuestions.has(topic);
    const hadQueries = this.topicQueries.has(topic);
    const hadAnswers = this.topicAnswers.has(topic);
    const hadRawResponses = this.topicRawResponses.has(topic);
    
    this.topicRecentQuestions.delete(topic);
    this.topicQueries.delete(topic);
    this.topicAnswers.delete(topic);
    this.topicRawResponses.delete(topic);
    
    if (hadQuestions || hadQueries || hadAnswers || hadRawResponses) {
      this.log(`🗑️ Cleared history for topic "${topic}"`);
    }
  }

  /**
   * Clear recent questions and queries for multiple topics.
   * @param topics - Array of topics to clear
   */
  clearTopicsHistory(topics: string[]): void {
    let clearedCount = 0;
    topics.forEach(topic => {
      const hadData = this.topicRecentQuestions.has(topic) || this.topicQueries.has(topic) || this.topicAnswers.has(topic);
      if (hadData) {
        this.topicRecentQuestions.delete(topic);
        this.topicQueries.delete(topic);
        this.topicAnswers.delete(topic);
        clearedCount++;
      }
    });
    
    if (clearedCount > 0) {
      this.log(`🗑️ Cleared history for ${clearedCount} topics: ${topics.join(', ')}`);
    }
  }

  /**
   * Remove stale topics that are no longer in the active topic list.
   * Useful for cleanup when room topics are changed.
   * @param activeTopics - Current active topics
   */
  cleanupStaleTopics(activeTopics: string[]): void {
    const activeSet = new Set(activeTopics);
    const staleTopics: string[] = [];
    
    // Find stale topics in recent questions
    for (const topic of this.topicRecentQuestions.keys()) {
      if (!activeSet.has(topic)) {
        staleTopics.push(topic);
      }
    }
    
    // Find stale topics in queries (might be different)
    for (const topic of this.topicQueries.keys()) {
      if (!activeSet.has(topic) && !staleTopics.includes(topic)) {
        staleTopics.push(topic);
      }
    }
    
    // Find stale topics in answers (might be different)
    for (const topic of this.topicAnswers.keys()) {
      if (!activeSet.has(topic) && !staleTopics.includes(topic)) {
        staleTopics.push(topic);
      }
    }
    
    // Find stale topics in raw responses (might be different)
    for (const topic of this.topicRawResponses.keys()) {
      if (!activeSet.has(topic) && !staleTopics.includes(topic)) {
        staleTopics.push(topic);
      }
    }
    
    if (staleTopics.length > 0) {
      this.clearTopicsHistory(staleTopics);
      this.log(`🧹 Cleaned up ${staleTopics.length} stale topics`);
    }
  }

  /**
   * Get analytics about topic history state.
   * @returns Object with topic statistics
   */
  getTopicAnalytics(): { 
    totalTopics: number;
    topicsWithQuestions: number;
    topicsWithQueries: number;
    topicsWithRawResponses: number;
    totalQuestions: number;
    totalQueries: number;
    totalRawResponses: number;
    topicBreakdown: Array<{topic: string, questions: number, queries: number, rawResponses: number}>;
  } {
    const allTopics = new Set([
      ...this.topicRecentQuestions.keys(),
      ...this.topicQueries.keys(),
      ...this.topicRawResponses.keys()
    ]);
    
    const topicBreakdown = Array.from(allTopics).map(topic => ({
      topic,
      questions: this.topicRecentQuestions.get(topic)?.length || 0,
      queries: this.topicQueries.get(topic)?.length || 0,
      rawResponses: this.topicRawResponses.get(topic)?.length || 0
    }));
    
    const totalQuestions = Array.from(this.topicRecentQuestions.values())
      .reduce((sum, questions) => sum + questions.length, 0);
    
    const totalQueries = Array.from(this.topicQueries.values())
      .reduce((sum, queries) => sum + queries.length, 0);
    
    const totalRawResponses = Array.from(this.topicRawResponses.values())
      .reduce((sum, responses) => sum + responses.length, 0);
    
    return {
      totalTopics: allTopics.size,
      topicsWithQuestions: this.topicRecentQuestions.size,
      topicsWithQueries: this.topicQueries.size,
      topicsWithRawResponses: this.topicRawResponses.size,
      totalQuestions,
      totalQueries,
      totalRawResponses,
      topicBreakdown
    };
  }

  /**
   * Lightweight metrics about the in-memory question buffer.
   * @returns Object describing buffer fill level and tracked topics
   */
  getBufferMetrics(): { pendingQuestions: number; bufferCapacity: number; topicsTracked: number } {
    return {
      pendingQuestions: this.questionBuffer.length,
      bufferCapacity: this.questionBufferSize,
      topicsTracked: this.topicRecentQuestions.size,
    };
  }

  /**
   * Perform automatic cleanup and maintenance.
   * Removes stale topics and trims oversized histories.
   * @param activeTopics - Current active topics list
   * @param maxQuestionsPerTopic - Maximum questions to keep per topic (default: 10)
   * @param maxQueriesPerTopic - Maximum queries to keep per topic (default: 10)
   */
  performMaintenance(
    activeTopics: string[], 
    maxQuestionsPerTopic: number = 10, 
    maxQueriesPerTopic: number = 10
  ): void {
    // Clean up stale topics first
    this.cleanupStaleTopics(activeTopics);
    
    let trimmedTopics = 0;
    
    // Trim oversized question histories
    for (const [topic, questions] of this.topicRecentQuestions.entries()) {
      if (questions.length > maxQuestionsPerTopic) {
        const trimmed = questions.slice(-maxQuestionsPerTopic);
        this.topicRecentQuestions.set(topic, trimmed);
        trimmedTopics++;
      }
    }
    
    // Trim oversized query histories
    for (const [topic, queries] of this.topicQueries.entries()) {
      if (queries.length > maxQueriesPerTopic) {
        const trimmed = queries.slice(-maxQueriesPerTopic);
        this.topicQueries.set(topic, trimmed);
        trimmedTopics++;
      }
    }
    
    if (trimmedTopics > 0) {
      this.log(`🔧 Maintenance: Trimmed ${trimmedTopics} oversized topic histories`);
    }
    
    const analytics = this.getTopicAnalytics();
    this.log(`📊 Post-maintenance: ${analytics.totalTopics} topics, ${analytics.totalQuestions} questions, ${analytics.totalQueries} queries`);
  }

  /**
   * Pre-fill using new parallel topic pool system:
   * 1. Start loading ALL topics in parallel (don't block)
   * 2. Wait for ANY topic to finish loading
   * 3. Fill buffer from available topic pools
   * 4. Continue loading other topics in background
   *
   * @throws Error if no topics are set
   */
  async preFillBuffer(): Promise<void> {
    if (this.state.currentTopic === "__DEV__") {
      this.log("⚙️ Development mode active. Skipping question buffer pre-generation.");
      return;
    }
    const topics = this.state.topics || [];
    if (topics.length === 0) throw new Error("No topics set. Please add at least one topic before starting the game.");
  
    this.log(`🔄 Warming pools for ${topics.length} topics (batch=${this.TOPIC_POOL_SIZE})…`);
    const loads = topics.map(t => this.ensureTopicPool(t)); // fire all
  
    try {
      await this.anyWithTimeout(loads, 800); // don't hang here
      this.log("✅ At least one pool ready (or timeout) — filling buffer");
    } catch (e) {
      this.log("⚠️ No pools ready yet (or all failed) — proceeding anyway", e);
    }
  
    // Fill up to the configured size using the unified path
    await this.fillToTarget(this.questionBufferSize);
  
    // Log final state once all loads settle in the background
    void Promise.allSettled(loads).then(_ => {
      const sizes = (this.state.topics || [])
        .map(t => `${t}: ${this.getTopicPoolSize(t)}`).join(", ");
      this.log(`📊 Pool sizes after warm: ${sizes}`);
    });
  
    this.log(`✅ Prefill complete: buffer=${this.questionBuffer.length}/${this.questionBufferSize}`);
  }

  /**
   * Retrieves the next question from the buffer if available; otherwise, tries DB,
   * and finally falls back to generation. Triggers background refills when a question
   * is consumed.
   *
   * @returns The next question or null on generation failure
   * @throws Error if topics list is empty
   */
  async getNextQuestion(): Promise<GeneratedQuestion | null> {
    // Ensure at least one is ready (fast if already full)
    if (this.questionBuffer.length === 0) {
      await this.fillToTarget(1); // unified path will use pools / await-any / or generate
    }
    if (this.questionBuffer.length === 0) return null; // still nothing — give up gracefully
  
    const q = this.questionBuffer.shift()!;
    const servedTopic = q.sourceTopic || null;
    this.log(`📤 Serving: "${q.question}" (buffer ${this.questionBuffer.length}/${this.questionBufferSize})`);

    // Non-blocking write; player shouldn't wait on DB I/O
    void this.questionDatabase
      .markQuestionAsUsed({ id: q.questionId, question: q.question })
      .catch((err: unknown) => this.log("markQuestionAsUsed failed", err));
  
    // Keep topping up in the background; no duplicate work thanks to the mutex
    void this.fillToTarget(this.questionBufferSize).catch(err =>
      this.log("⚠️ Background top-up failed", err)
    );
  
    return q;
  }
  


  // ========================================
  // NEW: Topic Pool Management Methods
  // ========================================

  /**
   * Ensures a topic pool is loaded or loading. Coalesces concurrent requests.
   * @param topic - The topic to ensure has a loaded pool
   * @returns Promise that resolves when the topic pool is ready
   */
  private async ensureTopicPool(topic: string): Promise<void> {
    // If a load is in-flight, reuse it
    if (this.topicLoadPromises.has(topic)) {
      return this.topicLoadPromises.get(topic)!;
    }
  
    // ❗ If we already have a pool entry (even empty), do NOT reload immediately
    if (this.topicQuestionPools.has(topic)) {
      return;
    }
  
    const loadPromise = this.loadTopicPool(topic);
    this.topicLoadPromises.set(topic, loadPromise);
    loadPromise.finally(() => this.topicLoadPromises.delete(topic));
    return loadPromise;
  }

  /**
   * Loads a large batch of questions for a specific topic from the database.
   * @param topic - The topic to load questions for
   */
  private async loadTopicPool(topic: string): Promise<void> {
    try {
      const dbQuestions = await this.questionDatabase.getQuestions(
        topic, 
        this.state.currentDifficulty || 3, 
        this.TOPIC_POOL_SIZE
      );
      
      // Filter out recently used questions from previous sessions
      const recentQuestions = this.getTopicRecentQuestions(topic);
      const availableQuestions = dbQuestions
        .filter((q: GeneratedQuestion) => !recentQuestions.includes(q.question))
        .map((question: GeneratedQuestion) => ({
          ...question,
          sourceTopic: question.sourceTopic || topic,
        }));
      
      this.topicQuestionPools.set(topic, availableQuestions);
      this.log(`📦 Loaded ${availableQuestions.length}/${dbQuestions.length} available questions for topic "${topic}"`);
      
    } catch (error) {
      this.log(`❌ Failed to load topic pool for "${topic}":`, error);
      this.topicQuestionPools.set(topic, []); // Set empty to avoid retry loops
    }
  }

  /**
   * Thread-safe wrapper for refill operations using a mutex.
   * @param operation - The async operation to run with mutex protection
   */
  private async withRefillLock<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.refillMutex.then(async () => {
      return await operation();
    });
    this.refillMutex = result.then(() => {}, () => {}); // Continue chain regardless of success/failure
    return result;
  }

  /**
   * Gets the current topic pool size for a given topic.
   * @param topic - The topic to check
   * @returns Number of questions available in the topic pool
   */
  private getTopicPoolSize(topic: string): number {
    return (this.topicQuestionPools.get(topic) || []).length;
  }

  /**
   * Checks if any topic pools have available questions.
   * @returns True if at least one topic has questions available
   */
  private hasAvailablePoolQuestions(): boolean {
    return Array.from(this.topicQuestionPools.values()).some(pool => pool.length > 0);
  }

  /**
   * Checks if any topics are currently loading.
   * @returns True if at least one topic is being loaded
   */
  private hasLoadingTopics(): boolean {
    return this.topicLoadPromises.size > 0;
  }

  /**
   * Promise.any with a small timeout so we don't hang cold starts
   */
  private anyWithTimeout<T>(promises: Promise<T>[], ms = 800): Promise<T> {
    return Promise.any([
      ...promises,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error("pool-timeout")), ms)),
    ]);
  }

  /**
   * Fill the buffer up to `target` using topic-targeted serving for fairness.
   * Serialized via the mutex so multiple callers don't overlap work.
   * @param target - The target number of questions to fill the buffer to
   */
  private async fillToTarget(target: number): Promise<void> {
    await this.withRefillLock(async () => {
      while (this.questionBuffer.length < target) {
        const question = await this.getQuestionForTargetTopic();
        if (!question) break; // give up if all methods failed
        
        this.questionBuffer.push(question);
        this.log(`📦 +1 topic-targeted → buffer ${this.questionBuffer.length}/${target}`);
      }
    });
  }

  /**
   * Gets a question for the next topic in round-robin order.
   * Ensures fair distribution across topics regardless of pool availability.
   * 
   * @returns A question for the target topic, or null if all methods fail
   */
  private async getQuestionForTargetTopic(): Promise<GeneratedQuestion | null> {
    const topics = this.state.topics || [];
    if (topics.length === 0) return null;

    // Pick the next topic (round-robin)
    const targetTopic = topics[this.rrIndex % topics.length];
    this.log(`🎯 Target topic: "${targetTopic}" (RR index: ${this.rrIndex})`);

    // For this specific topic, try: pool → wait for load → generate
    
    // 1) Try topic's pool first
    const pool = this.topicQuestionPools.get(targetTopic) || [];
    if (pool.length > 0) {
      const question = pool.shift()!;
      this.addTopicRecentQuestion(targetTopic, question.question);
      this.rrIndex = (this.rrIndex + 1) % topics.length; // Advance only on success
      this.log(`📤 Using question from "${targetTopic}" pool`);
      return {
        ...question,
        sourceTopic: question.sourceTopic || targetTopic,
      };
    }

    // 2) If topic is loading, wait briefly for it to finish
    const loadPromise = this.topicLoadPromises.get(targetTopic);
    if (loadPromise) {
      this.log(`⏳ Waiting for "${targetTopic}" to finish loading...`);
      try {
        await this.anyWithTimeout([loadPromise], 800);
        // Try pool again after load completes
        const poolAfterLoad = this.topicQuestionPools.get(targetTopic) || [];
        if (poolAfterLoad.length > 0) {
          const question = poolAfterLoad.shift()!;
          this.addTopicRecentQuestion(targetTopic, question.question);
          this.rrIndex = (this.rrIndex + 1) % topics.length; // Advance only on success
          this.log(`📤 Using question from "${targetTopic}" pool after load`);
          return {
            ...question,
            sourceTopic: question.sourceTopic || targetTopic,
          };
        }
      } catch (error) {
        this.log(`⚠️ Load timeout/failed for "${targetTopic}":`, error);
      }
    }

    // 3) Generate for this specific topic
    this.log(`🤖 Generating question for target topic "${targetTopic}"`);
    const generatedQuestion = await this.generateQuestionForTopic(targetTopic);
    if (generatedQuestion) {
      this.rrIndex = (this.rrIndex + 1) % topics.length; // Advance only on success
    }
    return generatedQuestion;
  }

  /**
   * Generates a question for a specific topic (not necessarily current topic).
   * Used for topic-targeted serving to ensure fair distribution.
   * 
   * @param targetTopic - The specific topic to generate a question for
   * @returns Generated question or null on failure
   */
  private async generateQuestionForTopic(targetTopic: string): Promise<GeneratedQuestion | null> {
    const difficulty = this.state.currentDifficulty || 3;

    try {
      const topicRecentQuestions = this.getTopicRecentQuestions(targetTopic);
      const topicSpecificQueries = this.getTopicQueries(targetTopic);
      const topicPreviousAnswers = this.getTopicAnswers(targetTopic);
      const topicRawResponses = this.getTopicRawResponses(targetTopic);
      
      const questionRequest = {
        topic: targetTopic, // Use target topic, not current topic
        difficulty,
        previousQuestions: topicRecentQuestions,
        previousSearchQueries: topicSpecificQueries,
        previousAnswers: topicPreviousAnswers,
        previousRawResponses: topicRawResponses
      };

      const generatedQuestion = await this.geminiService.generateQuestion(questionRequest);

      await this.questionDatabase.storeQuestion(targetTopic, difficulty, generatedQuestion);

      const annotatedQuestion: GeneratedQuestion = {
        ...generatedQuestion,
        sourceTopic: generatedQuestion.sourceTopic || targetTopic,
      };

      this.addTopicRecentQuestion(targetTopic, annotatedQuestion.question);
      this.addTopicAnswer(targetTopic, annotatedQuestion.correctAnswer);

      // Add raw fact response if available
      if (annotatedQuestion.rawFactResponse) {
        this.addTopicRawResponse(targetTopic, annotatedQuestion.rawFactResponse);
      }

      // Add actual web search queries if any were used
      if (annotatedQuestion.webSearchQueries && annotatedQuestion.webSearchQueries.length > 0) {
        annotatedQuestion.webSearchQueries.forEach(query => this.addTopicQuery(targetTopic, query));
        this.log(`🔍 Captured ${annotatedQuestion.webSearchQueries.length} search queries for "${targetTopic}"`);
      }

      this.log(`🤖 Generated question for target topic "${targetTopic}": "${annotatedQuestion.question}"`);
      return annotatedQuestion;

    } catch (error) {
      console.error(`Failed to generate question for topic "${targetTopic}":`, error);
      return null;
    }
  }

}
