/**
 * Utility for tracking a capped list of recent question texts.
 */
export class RecentQuestions {
  private readonly maxSize: number;
  private items: string[] = [];

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
  }

  has(text: string): boolean {
    return this.items.includes(text);
  }

  push(text: string): void {
    this.items.push(text);
    if (this.items.length > this.maxSize) {
      this.items.shift();
    }
  }

  clear(): void {
    this.items = [];
  }

  toArray(): string[] {
    return [...this.items];
  }
}


