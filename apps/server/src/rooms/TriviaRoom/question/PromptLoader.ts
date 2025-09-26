import { GeneratedQuestion, QuestionImageMetadata } from "../../../services/GeminiService";
import { TriviaRoomState } from "../../schema/TriviaRoomState";
import { STATIC_PROMPTS } from "../staticPrompts";

/**
 * Responsible for mapping a GeneratedQuestion into the room state's current prompt
 * and providing static prompt fallback utilities.
 */
export class PromptLoader {
  private readonly state: TriviaRoomState;
  private readonly getStaticPrompts: () => Array<{ id: string; text: string; category: string; difficulty: "easy" | "medium" | "hard"; answer: string; }>;
  private readonly usedPrompts: Set<string>;

  /**
   * @param params.state Room state to mutate current prompt fields
   * @param params.getStaticPrompts Supplier for the room's static prompts array
   * @param params.usedPrompts Set tracking used static prompt IDs
   */
  constructor(params: {
    state: TriviaRoomState;
    getStaticPrompts: () => Array<{ id: string; text: string; category: string; difficulty: "easy" | "medium" | "hard"; answer: string; }>;
    usedPrompts: Set<string>;
  }) {
    this.state = params.state;
    this.getStaticPrompts = params.getStaticPrompts;
    this.usedPrompts = params.usedPrompts;
  }

  /**
   * Loads a generated question into `state.currentPrompt` and returns its answer payload.
   *
   * @returns Object containing correctAnswer and acceptableAnswers for runtime use
   */
  loadGeneratedQuestion(generated: GeneratedQuestion): { correctAnswer: string; acceptableAnswers: string[] } {
    this.state.currentPrompt.id = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.state.currentPrompt.text = generated.question;
    this.state.currentPrompt.category = generated.category;
    this.state.currentPrompt.difficulty = this.mapDifficultyToString(generated.difficulty);
    this.state.currentPrompt.topic = this.state.currentTopic || "";
    this.state.currentPrompt.difficultyLevel = generated.difficulty;
    this.state.currentPrompt.acceptableAnswers = generated.acceptableAnswers;
    this.applyPromptImage(generated.image);

    return {
      correctAnswer: generated.correctAnswer,
      acceptableAnswers: generated.acceptableAnswers,
    };
  }

  /**
   * Loads a static prompt into state, used when AI generation fails completely.
   */
  loadStaticPrompt(): { correctAnswer: string; acceptableAnswers: string[] } {
    const prompts = this.getStaticPrompts ? this.getStaticPrompts() : STATIC_PROMPTS;
    const available = prompts.filter(p => !this.usedPrompts.has(p.id));
    if (available.length === 0) {
      this.usedPrompts.clear();
      available.push(...prompts);
    }
    const selected = available[Math.floor(Math.random() * available.length)];
    this.usedPrompts.add(selected.id);

    this.state.currentPrompt.id = selected.id;
    this.state.currentPrompt.text = selected.text;
    this.state.currentPrompt.category = selected.category;
    this.state.currentPrompt.difficulty = selected.difficulty;
    this.state.currentPrompt.topic = "Mixed Topics";
    this.state.currentPrompt.difficultyLevel = this.mapStringToNumber(selected.difficulty);
    this.state.currentPrompt.acceptableAnswers = [selected.answer];
    this.applyPromptImage(null);

    return { correctAnswer: selected.answer, acceptableAnswers: [selected.answer] };
  }

  private applyPromptImage(imageMetadata: QuestionImageMetadata | null | undefined) {
    const promptImage = this.state.currentPrompt.image;
    if (!promptImage) {
      return;
    }

    // Reset existing values to avoid leaking data between prompts
    promptImage.url = "";
    promptImage.altText = "";
    promptImage.width = 0;
    promptImage.height = 0;
    promptImage.attribution = "";
    promptImage.source = "";
    promptImage.mime = "";
    promptImage.original_url = "";
    promptImage.storage_key = "";

    if (!imageMetadata || typeof imageMetadata.url !== 'string' || !imageMetadata.url.trim()) {
      return;
    }

    promptImage.url = this.normalizeImageString(imageMetadata.url);
    promptImage.altText = this.normalizeImageString(imageMetadata.altText);
    promptImage.width = this.normalizeImageNumber(imageMetadata.width);
    promptImage.height = this.normalizeImageNumber(imageMetadata.height);
    promptImage.attribution = this.normalizeImageString(imageMetadata.attribution);
    promptImage.source = this.normalizeImageString(imageMetadata.source);
    promptImage.mime = this.normalizeImageString(imageMetadata.mime);
    promptImage.original_url = this.normalizeImageString(imageMetadata.original_url);
    promptImage.storage_key = this.normalizeImageString(imageMetadata.storage_key);
  }

  private normalizeImageString(value: unknown): string {
    if (typeof value === 'string') {
      return value.trim();
    }
    if (value === null || value === undefined) {
      return "";
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return "";
  }

  private normalizeImageNumber(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return 0;
  }

  private mapDifficultyToString(difficulty: number): string {
    if (difficulty <= 1) return "very easy";
    if (difficulty <= 2) return "easy";
    if (difficulty <= 3) return "medium";
    if (difficulty <= 4) return "hard";
    return "very hard";
  }

  private mapStringToNumber(difficulty: string): number {
    switch (difficulty.toLowerCase()) {
      case "easy": return 2;
      case "medium": return 3;
      case "hard": return 4;
      default: return 3;
    }
  }
}
