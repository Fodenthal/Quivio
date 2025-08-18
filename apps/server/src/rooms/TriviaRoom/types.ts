export type DifficultyString = "easy" | "medium" | "hard";

export interface StaticPrompt {
  id: string;
  text: string;
  category: string;
  difficulty: DifficultyString;
  answer: string;
}


