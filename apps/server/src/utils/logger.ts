/**
 * Centralized Logging System for Trivia Game Server
 * 
 * Provides structured logging with proper categorization and level control.
 * Separates different types of logs (AI/LLM, Game Lifecycle, System) for better debugging.
 */

import pino from 'pino';

/**
 * Log categories for better organization and filtering
 */
export enum LogCategory {
  SYSTEM = 'system',
  GAME = 'game', 
  AI = 'ai',
  PLAYER = 'player',
  PERFORMANCE = 'performance',
  ERROR = 'error'
}

/**
 * Structured log data interface
 */
export interface LogContext {
  roomId?: string;
  playerId?: string;
  topic?: string;
  round?: number;
  duration?: number;
  category: LogCategory;
  [key: string]: any;
}

/**
 * Create logger instance with appropriate configuration
 */
function createLogger() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

  const baseConfig = {
    level: logLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  // In development, use pretty printing for better readability
  if (isDevelopment) {
    return pino({
      ...baseConfig,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
          singleLine: false,
          levelFirst: true,
          messageFormat: '[{category}] {msg}',
        }
      }
    });
  }

  // In production, use structured JSON output
  return pino(baseConfig);
}

const logger = createLogger();

/**
 * Centralized logging utility with category-based organization
 */
export class Logger {
  /**
   * Log system-level events (startup, configuration, errors)
   */
  static system(message: string, context: Partial<LogContext> = {}) {
    const logContext = { ...context, category: LogCategory.SYSTEM };
    logger.info(logContext, message);
  }

  /**
   * Log game lifecycle events (room creation, game start/end, rounds)
   */
  static game(message: string, context: Partial<LogContext> = {}) {
    const logContext = { ...context, category: LogCategory.GAME };
    logger.info(logContext, message);
  }

  /**
   * Log AI/LLM related events (question generation, fact gathering, web search)
   * Use this for debugging AI responses and performance
   */
  static ai(message: string, context: Partial<LogContext> = {}) {
    const logContext = { ...context, category: LogCategory.AI };
    logger.info(logContext, message);
  }

  /**
   * Log AI responses and web search data (debug level only)
   * Only shows in development or when LOG_LEVEL=debug
   */
  static aiDebug(message: string, context: Partial<LogContext> = {}) {
    const logContext = { ...context, category: LogCategory.AI };
    logger.debug(logContext, message);
  }

  /**
   * Log player-related events (join, leave, guesses, ready states)
   */
  static player(message: string, context: Partial<LogContext> = {}) {
    const logContext = { ...context, category: LogCategory.PLAYER };
    logger.info(logContext, message);
  }

  /**
   * Log performance metrics and timing data
   */
  static performance(message: string, context: Partial<LogContext> = {}) {
    const logContext = { ...context, category: LogCategory.PERFORMANCE };
    logger.info(logContext, message);
  }

  /**
   * Log warnings
   */
  static warn(message: string, context: Partial<LogContext> = {}) {
    logger.warn(context, message);
  }

  /**
   * Log errors with full context
   */
  static error(message: string, error?: Error, context: Partial<LogContext> = {}) {
    const logContext = { 
      ...context, 
      category: LogCategory.ERROR,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    };
    logger.error(logContext, message);
  }

  /**
   * Development-only debug logging
   * Only appears when NODE_ENV=development or LOG_LEVEL=debug
   */
  static debug(message: string, context: Partial<LogContext> = {}) {
    logger.debug(context, message);
  }
}

/**
 * Create a child logger for specific contexts (e.g., specific room)
 * Useful for adding consistent context to all logs from a particular component
 */
export function createChildLogger(context: Partial<LogContext>) {
  return {
    system: (msg: string, ctx: Partial<LogContext> = {}) => Logger.system(msg, { ...context, ...ctx }),
    game: (msg: string, ctx: Partial<LogContext> = {}) => Logger.game(msg, { ...context, ...ctx }),
    ai: (msg: string, ctx: Partial<LogContext> = {}) => Logger.ai(msg, { ...context, ...ctx }),
    aiDebug: (msg: string, ctx: Partial<LogContext> = {}) => Logger.aiDebug(msg, { ...context, ...ctx }),
    player: (msg: string, ctx: Partial<LogContext> = {}) => Logger.player(msg, { ...context, ...ctx }),
    performance: (msg: string, ctx: Partial<LogContext> = {}) => Logger.performance(msg, { ...context, ...ctx }),
    warn: (msg: string, ctx: Partial<LogContext> = {}) => Logger.warn(msg, { ...context, ...ctx }),
    error: (msg: string, error?: Error, ctx: Partial<LogContext> = {}) => Logger.error(msg, error, { ...context, ...ctx }),
    debug: (msg: string, ctx: Partial<LogContext> = {}) => Logger.debug(msg, { ...context, ...ctx }),
  };
}

export default Logger;
