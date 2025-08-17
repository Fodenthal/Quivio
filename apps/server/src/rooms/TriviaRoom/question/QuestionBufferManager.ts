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
  private recentQuestions: string[] = [];

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
   * Clears the recent questions list to allow questions to repeat after topic changes.
   */
  resetRecents(): void {
    this.recentQuestions = [];
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
      if (!this.recentQuestions.includes(cachedQuestion.question)) {
        this.questionBuffer.push(cachedQuestion);
        this.recentQuestions.push(cachedQuestion.question);
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
    const availableDbQuestions = dbQuestions.filter((q: any) => !this.recentQuestions.includes(q.question));

    if (availableDbQuestions.length > 0) {
      const question = availableDbQuestions[0];

      this.recentQuestions.push(question.question);
      if (this.recentQuestions.length > 50) {
        this.recentQuestions.shift();
      }

      await this.questionDatabase.markQuestionAsUsed(question.question);

      this.state.currentTopicIndex = (this.state.currentTopicIndex + 1) % allTopics.length;
      this.state.currentTopic = allTopics[this.state.currentTopicIndex];

      this.log(`📤 Using database question directly: "${question.question}" (Topic: ${topic})`);
      this.refillBackground();
      return question;
    }

    this.log("⚠️ No suitable questions in database, generating question directly...");

    try {
      const questionRequest = {
        topic,
        difficulty,
        previousQuestions: this.recentQuestions
      };

      const generatedQuestion = await this.geminiService.generateQuestion(questionRequest);

      await this.questionDatabase.storeQuestion(topic, difficulty, generatedQuestion);

      this.recentQuestions.push(generatedQuestion.question);
      if (this.recentQuestions.length > 50) {
        this.recentQuestions.shift();
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
        if (!this.recentQuestions.includes(cachedQuestion.question)) {
          this.questionBuffer.push(cachedQuestion);
          this.recentQuestions.push(cachedQuestion.question);
          if (this.recentQuestions.length > 50) {
            this.recentQuestions.shift();
          }
          this.state.currentTopicIndex = (this.state.currentTopicIndex + 1) % allTopics.length;
          this.state.currentTopic = allTopics[this.state.currentTopicIndex];
          this.log(`📦 Added cached question to buffer: "${cachedQuestion.question}" (Topic: ${topic}, Buffer: ${this.questionBuffer.length}/${this.questionBufferSize})`);
          return;
        }
      }

      const questionRequest = {
        topic,
        difficulty,
        previousQuestions: this.recentQuestions
      };

      const generatedQuestion = await this.geminiService.generateQuestion(questionRequest);
      await this.questionDatabase.storeQuestion(topic, difficulty, generatedQuestion);

      this.questionBuffer.push(generatedQuestion);
      this.recentQuestions.push(generatedQuestion.question);
      if (this.recentQuestions.length > 50) {
        this.recentQuestions.shift();
      }

      this.state.currentTopicIndex = (this.state.currentTopicIndex + 1) % allTopics.length;
      this.state.currentTopic = allTopics[this.state.currentTopicIndex];
      this.log(`📦 Added generated question to buffer: "${generatedQuestion.question}" (Topic: ${topic}, Buffer: ${this.questionBuffer.length}/${this.questionBufferSize})`);
    } finally {
      this.isGeneratingQuestions = false;
    }
  }
}


