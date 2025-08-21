# Logging System

This document explains the new structured logging system implemented for the trivia game server.

## Overview

The logging system uses [Pino](https://getpino.io/) for structured JSON logging with proper categorization and level control to reduce verbosity and improve debugging.

## Log Categories

Logs are organized into distinct categories:

- **`system`** - Server startup, configuration, room disposal
- **`game`** - Game lifecycle events (start, round changes, player actions)
- **`ai`** - AI/LLM operations (question generation, fact gathering, web search)
- **`player`** - Player-specific events (join, leave, guesses)
- **`performance`** - Performance metrics and timing data
- **`error`** - Error conditions with full context

## Log Levels

- **`ERROR`** - System errors requiring immediate attention
- **`WARN`** - Potential issues to monitor
- **`INFO`** - Important business events (default level)
- **`DEBUG`** - Detailed diagnostic information (development only)

## Configuration

### Environment Variables

- **`LOG_LEVEL`** - Set log level (`debug`, `info`, `warn`, `error`)
- **`NODE_ENV`** - Controls output format
  - `development` - Pretty-printed, human-readable output
  - `production` - Structured JSON output

### Examples

```bash
# Development with debug logging
NODE_ENV=development LOG_LEVEL=debug npm run dev

# Production with info logging (default)
NODE_ENV=production LOG_LEVEL=info npm start

# Only show warnings and errors
LOG_LEVEL=warn npm start
```

## Usage Examples

### Basic Logging

```typescript
import { Logger } from '../utils/logger';

// Game lifecycle events
Logger.game("Round started", { round: 3, topic: "science" });

// AI operations
Logger.ai("Question generation completed", { 
  topic: "history", 
  duration: 1500,
  webSearchCount: 2
});

// Player actions
Logger.player("Player joined", { playerId: "abc123" });

// Errors with context
Logger.error("Database connection failed", error, { operation: "question_fetch" });
```

### Child Loggers (Room-specific)

```typescript
import { createChildLogger } from '../utils/logger';

class TriviaRoom {
  private log = createChildLogger({ roomId: this.roomId });

  onJoin(client: Client) {
    // All logs automatically include roomId
    this.log.player("Player joined", { playerId: client.sessionId });
  }
}
```

## Development vs Production

### Development Output
```
14:30:25 INFO  [game] Round started {"round":3,"topic":"science","roomId":"room_123"}
14:30:26 DEBUG [ai] Complete fact gathering response {"topic":"science","response":{...}}
```

### Production Output
```json
{"level":"info","time":"2024-01-15T14:30:25.123Z","category":"game","msg":"Round started","round":3,"topic":"science","roomId":"room_123"}
{"level":"debug","time":"2024-01-15T14:30:26.456Z","category":"ai","msg":"Complete fact gathering response","topic":"science","response":{...}}
```

## Benefits

1. **Reduced Verbosity** - Debug details only show in development
2. **Better Organization** - Separate AI logs from game lifecycle logs
3. **Structured Data** - Easy to parse and analyze
4. **Context Preservation** - Room ID and other context automatically included
5. **Production Ready** - JSON output suitable for log aggregation tools

## AI Response Logging

As requested, the fact gatherer now logs:
- **Complete response object** (debug level only)
- **Web search queries and metadata** (info level)
- **Raw response text** (debug level only)

This means in production, you'll see clean web search information without verbose AI responses cluttering the output.

## Migration from console.log

The old `console.log` statements have been replaced with appropriate Logger calls:

- Game events → `Logger.game()`
- AI operations → `Logger.ai()` or `Logger.aiDebug()`
- Player actions → `Logger.player()`
- System events → `Logger.system()`
- Errors → `Logger.error()`

## Filtering Logs

You can filter logs by category using tools like `jq`:

```bash
# Show only game-related logs
npm start | jq 'select(.category == "game")'

# Show only AI logs with timing > 1000ms
npm start | jq 'select(.category == "ai" and .duration > 1000)'

# Show only errors
npm start | jq 'select(.level >= 50)'
```
