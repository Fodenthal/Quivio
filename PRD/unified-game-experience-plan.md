# Refactoring Plan: Unified Game Experience

This document outlines the plan to refactor the game's user interface and state management to create a seamless, unified game experience.

## 1. Current Architecture

### Server State Management
- **File**: `apps/server/src/rooms/schema/TriviaRoomState.ts`
- **Current Approach**: Two boolean flags control game state:
  ```typescript
  @type("boolean") gameStarted: boolean = false;
  @type("boolean") gameEnded: boolean = false;
  ```
- **Ready System**: Each player has a `ready` boolean flag requiring explicit opt-in before games can start

### Frontend Component Architecture  
- **File**: `apps/web/src/app/components/GameLayout.tsx`
- **Current Logic**: Conditional rendering based on boolean combinations:
  ```typescript
  if (!gameState.gameStarted && !gameState.gameEnded) {
    return <GameLobby />; // Pre-game state
  } else {
    return <GameView />; // In-game OR post-game state
  }
  ```
- **Components**: `GameLobby` handles pre-game settings, `GameView` handles gameplay and winner screen

## 2. The Core Problems

### State Management Confusion
The current boolean-based approach creates **ambiguous edge cases**:
- What happens when `gameStarted=true` AND `gameEnded=true`?
- No clear representation of intermediate states (loading, round transitions)
- Frontend must infer game phases from boolean combinations

### Jarring User Experience
Players experience **unnecessary transitions** and **friction points**:
- Forced context switches between `GameLobby` and `GameView` components
- Players must click "Ready" before each game can start
- After games end, players are forced back to a separate lobby interface
- Loss of continuity disrupts the social flow of multiplayer gaming

### Root Cause: Legacy Lobby-Centric Design
The architecture assumes games are **discrete sessions** requiring explicit setup, rather than **continuous social experiences** where games flow naturally into each other.

## 3. Vision & Goal

**Primary Goal**: Eliminate the `GameLobby` component and merge its functionality into a single, continuous `GameView`. This creates a more immersive and modern user experience, removing friction points and enabling seamless game-to-game transitions.

## 4. The New, Unified Flow

The user journey will be significantly streamlined:

1.  **Join Room**: A player joins a room and is immediately taken to the unified `GameView`.
2.  **Pre-Game State (`waiting`)**:
    *   The `PlayerList` and `Chat` components are visible.
    *   The main content area displays the `AISettingsPanel`.
    *   The host can configure the game settings; other players see them in a read-only state.
    *   A "Start Game" button is visible only to the host.
3.  **Game in Progress (`in_progress`)**:
    *   The `AISettingsPanel` is replaced by the question and answer interface.
    *   `PlayerList` and `Chat` remain, allowing for interaction during the game.
4.  **Post-Game State (`game_ended`)**:
    *   The question interface is replaced by the `WinnerScreen`.
    *   `PlayerList` (with final scores) and `Chat` remain.
    *   A "Play Again" button appears for the host, allowing for a seamless transition back to the pre-game state without anyone leaving the room.

## 5. Implementation Plan

This refactor requires coordinated changes across the frontend and backend.

### Phase 1: Backend - Evolving the Server State

The server's state machine will be updated to be more descriptive.

*   **File to Modify**: `apps/server/src/rooms/schema/TriviaRoomState.ts`
*   **Change**: Replace the `gameStarted` and `gameEnded` booleans with a `gameStatus` enum:

    ```typescript
    export enum GameStatus {
      WAITING = "waiting",
      IN_PROGRESS = "in_progress",
      GAME_ENDED = "game_ended",
    }

    // In TriviaRoomState class
    @type("string") gameStatus: string = GameStatus.WAITING;
    ```

### Phase 2: Frontend - UI and Component Refactoring

1.  **Unify `GameView.tsx`**:
    *   Merge the UI and logic from `GameLobby.tsx` into `GameView.tsx`.
    *   Use the new `gameStatus` to conditionally render the appropriate UI for each phase (pre-game, in-game, post-game).
2.  **Apply existing `AISettingsPanel.tsx`**:
    *   Extract the host's game settings UI into a reusable component that can be displayed in the pre-game state.
3.  **Simplify `GameLayout.tsx`**:
    *   Remove the logic that switches between `GameLobby` and `GameView`. The layout will now only need to render the unified `GameView`.

### Phase 3: Backend - Updating Room Logic

*   **File to Modify**: `apps/server/src/rooms/TriviaRoom.ts`
*   **Actions**:
    *   Update all logic that previously checked `gameStarted` or `gameEnded` to use the new `gameStatus`.
    *   Implement a `"play_again"` message handler that resets the game state and transitions the `gameStatus` from `GAME_ENDED` back to `WAITING`.

## 6. Eliminating the "Ready" Logic

As part of this refactor, the concept of a player being "ready" (`isReady` flag) will be removed.

*   **Reasoning**: In the new, continuous flow, a player's presence in the room implies they are ready to participate. The "ready" check was a remnant of the lobby-based architecture where players needed to signal their intent to start.
*   **Impact**: This simplifies both the client and server logic. The "Start Game" button for the host will now be enabled as soon as the minimum number of players have joined, removing the need for everyone to click a "Ready" button. This further reduces friction and gets players into the game faster. (A spectator mode could be added in the future, but that is out of scope for this refactor).
