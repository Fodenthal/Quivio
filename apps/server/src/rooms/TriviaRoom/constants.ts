/**
 * Centralized constants for TriviaRoom. These mirror the previous inline constants
 * and are kept here to improve readability and reuse across managers.
 */
export const DEFAULT_TARGET_SCORE = 100;
export const DEFAULT_ROUND_TIME_MS = 20000; // 20 seconds
export const ROOM_DISPOSE_DELAY_MS = 60000; // 60 seconds before disposing empty room
export const GAME_LOOP_INTERVAL_MS = 100; // 100ms for better performance vs 50ms
export const TIMER_UPDATE_THRESHOLD_MS = 100; // Only update timer if changed by 100ms+
export const QUESTION_BUFFER_SIZE = 2; // Keep 2 questions ahead


