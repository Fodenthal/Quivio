export interface QuestionIdentifier {
  /**
   * Unique database identifier for a stored question, when available.
   * Supabase uses numeric IDs; SQLite uses AUTOINCREMENT integers.
   */
  id?: number | string;
  /**
   * Fallback question text used when no identifier is available.
   */
  question: string;
}
