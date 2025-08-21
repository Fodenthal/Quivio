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
  private isGeneratingQuestions = false;
  private topicRecentQuestions: Map<string, string[]> = new Map(); // Track recent questions per topic
  private topicQueries: Map<string, string[]> = new Map(); // Track search queries per topic
  private topicAnswers: Map<string, string[]> = new Map(); // Track previous answers per topic

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
    this.isGeneratingQuestions = false;
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
    this.log("🗑️ Cleared all topic recent questions, search queries, and answers");
  }

  /**
   * Clear recent questions and queries for a specific topic.
   * @param topic - The topic to clear
   */
  clearTopicHistory(topic: string): void {
    const hadQuestions = this.topicRecentQuestions.has(topic);
    const hadQueries = this.topicQueries.has(topic);
    const hadAnswers = this.topicAnswers.has(topic);
    
    this.topicRecentQuestions.delete(topic);
    this.topicQueries.delete(topic);
    this.topicAnswers.delete(topic);
    
    if (hadQuestions || hadQueries || hadAnswers) {
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
    totalQuestions: number;
    totalQueries: number;
    topicBreakdown: Array<{topic: string, questions: number, queries: number}>;
  } {
    const allTopics = new Set([
      ...this.topicRecentQuestions.keys(),
      ...this.topicQueries.keys()
    ]);
    
    const topicBreakdown = Array.from(allTopics).map(topic => ({
      topic,
      questions: this.topicRecentQuestions.get(topic)?.length || 0,
      queries: this.topicQueries.get(topic)?.length || 0
    }));
    
    const totalQuestions = Array.from(this.topicRecentQuestions.values())
      .reduce((sum, questions) => sum + questions.length, 0);
    
    const totalQueries = Array.from(this.topicQueries.values())
      .reduce((sum, queries) => sum + queries.length, 0);
    
    return {
      totalTopics: allTopics.size,
      topicsWithQuestions: this.topicRecentQuestions.size,
      topicsWithQueries: this.topicQueries.size,
      totalQuestions,
      totalQueries,
      topicBreakdown
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
   * Pre-fill the buffer by first pulling cached questions from the DB,
   * then generating remaining slots. Preserves existing logging.
   *
   * @throws Error if no topic is set
   */
  async preFillBuffer(): Promise<void> {
    if (this.state.currentTopic === "__DEV__") {
      this.log("⚙️ Development mode active. Skipping question buffer pre-generation.");
      return;
    }

    const topic = this.state.currentTopic || "";
    if (!topic) {
      throw new Error("No topic set. Please add at least one topic before starting the game.");
    }
    const difficulty = this.state.currentDifficulty || 3;

    this.log(`🔄 Pre-filling ${this.questionBufferSize} questions for buffer...`);

    const dbQuestions = await this.questionDatabase.getQuestions(topic, difficulty, this.questionBufferSize);

    for (const cachedQuestion of dbQuestions) {
      if (this.questionBuffer.length >= this.questionBufferSize) break;
      const topicRecentQuestions = this.getTopicRecentQuestions(topic);
      if (!topicRecentQuestions.includes(cachedQuestion.question)) {
        this.questionBuffer.push(cachedQuestion);
        this.addTopicRecentQuestion(topic, cachedQuestion.question);
        this.log(`📦 Pre-filled with cached question: "${cachedQuestion.question}"`);
      }
    }

    while (this.questionBuffer.length < this.questionBufferSize && !this.isGeneratingQuestions) {
      try {
        await this.generateAndAddToBuffer();
      } catch (error) {
        console.error("Failed to pre-generate question for buffer:", error);
        break;
      }
    }

    this.log(`✅ Question buffer initialized with ${this.questionBuffer.length} questions (${dbQuestions.length} from cache)`);

    const stats = await this.questionDatabase.getStats();
    this.log(`📊 Database stats: ${stats.totalQuestions} total questions, ${stats.topicCount} topics, avg usage: ${stats.avgUsagePerQuestion}`);
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
    if (this.questionBuffer.length > 0) {
      const question = this.questionBuffer.shift()!;
      this.log(`📤 Using buffered question: "${question.question}" (Remaining in buffer: ${this.questionBuffer.length})`);

      await this.questionDatabase.markQuestionAsUsed(question.question);
      this.refillBackground();
      return question;
    }

    const allTopics = this.state.topics || [];
    if (allTopics.length === 0) {
      throw new Error("No topics set. Please add at least one topic before starting the game.");
    }
    const topic = allTopics[this.state.currentTopicIndex % allTopics.length];
    const difficulty = this.state.currentDifficulty || 3;

    this.log("⚠️ Question buffer empty, checking database...");

    const dbQuestions = await this.questionDatabase.getQuestions(topic, difficulty, 5);
    const topicRecentQuestions = this.getTopicRecentQuestions(topic);
    const availableDbQuestions = dbQuestions.filter((q: any) => !topicRecentQuestions.includes(q.question));

    if (availableDbQuestions.length > 0) {
      const question = availableDbQuestions[0];

      this.addTopicRecentQuestion(topic, question.question);

      await this.questionDatabase.markQuestionAsUsed(question.question);

      this.state.currentTopicIndex = (this.state.currentTopicIndex + 1) % allTopics.length;
      this.state.currentTopic = allTopics[this.state.currentTopicIndex];

      this.log(`📤 Using database question directly: "${question.question}" (Topic: ${topic})`);
      this.refillBackground();
      return question;
    }

    this.log("⚠️ No suitable questions in database, generating question directly...");

    try {
      const topicRecentQuestions = this.getTopicRecentQuestions(topic);
      const topicSpecificQueries = this.getTopicQueries(topic);
      const topicPreviousAnswers = this.getTopicAnswers(topic);

      this.log(topicRecentQuestions)
      
      const questionRequest = {
        topic,
        difficulty,
        previousQuestions: topicRecentQuestions,
        previousSearchQueries: topicSpecificQueries,
        previousAnswers: topicPreviousAnswers
      };

      const generatedQuestion = await this.geminiService.generateQuestion(questionRequest);

      await this.questionDatabase.storeQuestion(topic, difficulty, generatedQuestion);

      this.addTopicRecentQuestion(topic, generatedQuestion.question);
      this.addTopicAnswer(topic, generatedQuestion.correctAnswer);

      // Add actual web search queries if any were used
      if (generatedQuestion.webSearchQueries && generatedQuestion.webSearchQueries.length > 0) {
        generatedQuestion.webSearchQueries.forEach(query => this.addTopicQuery(topic, query));
        this.log(`🔍 Captured ${generatedQuestion.webSearchQueries.length} actual search queries: ${generatedQuestion.webSearchQueries.join(', ')}`);
      } else {
        this.log(`📝 No search queries used for topic "${topic}" (search was disabled)`);
      }

      this.state.currentTopicIndex = (this.state.currentTopicIndex + 1) % allTopics.length;
      this.state.currentTopic = allTopics[this.state.currentTopicIndex];

      this.log(`📝 Generated question directly: "${generatedQuestion.question}" (Topic: ${topic})`);
      this.refillBackground();
      return generatedQuestion;
    } catch (error) {
      console.error("Failed to generate question directly:", error);
      return null;
    }
  }

  /**
   * Schedule a background refill if allowed. Non-blocking.
   */
  refillBackground(): void {
    if (this.state.currentTopic === "__DEV__" || this.isGeneratingQuestions) {
      return;
    }
    this.generateAndAddToBuffer().catch(error => {
      console.error("Background question generation failed:", error);
    });
  }

  private async generateAndAddToBuffer(): Promise<void> {
    if (this.isGeneratingQuestions || this.questionBuffer.length >= this.questionBufferSize) {
      return;
    }

    this.isGeneratingQuestions = true;
    try {
      const allTopics = this.state.topics || [];
      if (allTopics.length === 0) {
        throw new Error("No topics set. Please add at least one topic before starting the game.");
      }
      const topic = allTopics[this.state.currentTopicIndex % allTopics.length];
      const difficulty = this.state.currentDifficulty || 3;

      const dbQuestions = await this.questionDatabase.getQuestions(topic, difficulty, 1);
      if (dbQuestions.length > 0) {
        const cachedQuestion = dbQuestions[0];
        const topicRecentQuestions = this.getTopicRecentQuestions(topic);
        if (!topicRecentQuestions.includes(cachedQuestion.question)) {
          this.questionBuffer.push(cachedQuestion);
          this.addTopicRecentQuestion(topic, cachedQuestion.question);
          this.state.currentTopicIndex = (this.state.currentTopicIndex + 1) % allTopics.length;
          this.state.currentTopic = allTopics[this.state.currentTopicIndex];
          this.log(`📦 Added cached question to buffer: "${cachedQuestion.question}" (Topic: ${topic}, Buffer: ${this.questionBuffer.length}/${this.questionBufferSize})`);
          return;
        }
      }

      // Get topic-specific previous queries, questions, and answers for enhanced generation
      const topicSpecificQueries = this.getTopicQueries(topic);
      const topicRecentQuestions = this.getTopicRecentQuestions(topic);
      const topicPreviousAnswers = this.getTopicAnswers(topic);
      
      const questionRequest = {
        topic,
        difficulty,
        previousQuestions: topicRecentQuestions,
        previousSearchQueries: topicSpecificQueries,
        previousAnswers: topicPreviousAnswers
      };

      this.log(`🔍 Generating question for topic "${topic}" with ${topicRecentQuestions.length} previous questions, ${topicSpecificQueries.length} previous search queries, and ${topicPreviousAnswers.length} previous answers`);
      const generatedQuestion = await this.geminiService.generateQuestion(questionRequest);
      await this.questionDatabase.storeQuestion(topic, difficulty, generatedQuestion);

      // Add actual web search queries if any were used
      if (generatedQuestion.webSearchQueries && generatedQuestion.webSearchQueries.length > 0) {
        generatedQuestion.webSearchQueries.forEach(query => this.addTopicQuery(topic, query));
        this.log(`🔍 Captured ${generatedQuestion.webSearchQueries.length} actual search queries: ${generatedQuestion.webSearchQueries.join(', ')}`);
      } else {
        this.log(`📝 No search queries used for topic "${topic}" (search was disabled)`);
      }

      this.questionBuffer.push(generatedQuestion);
      this.addTopicRecentQuestion(topic, generatedQuestion.question);
      this.addTopicAnswer(topic, generatedQuestion.correctAnswer);

      this.state.currentTopicIndex = (this.state.currentTopicIndex + 1) % allTopics.length;
      this.state.currentTopic = allTopics[this.state.currentTopicIndex];
      this.log(`📦 Added generated question to buffer: "${generatedQuestion.question}" (Topic: ${topic}, Buffer: ${this.questionBuffer.length}/${this.questionBufferSize})`);
    } finally {
      this.isGeneratingQuestions = false;
    }
  }
}


