## JKLM-Style Scoring Algorithm Plan

This document outlines the proposed scoring algorithm for the Trivia game, combining JKLM-style positional bonuses with a time-based decay, ensuring a smooth transition and a minimum score of 1 point for very late guesses.

### Core Idea:
The score will primarily be determined by the player's rank among those who guessed correctly, but this rank-based score will be *multiplied* by a factor derived from the time remaining in the round. The first player to guess correctly will always receive 10 points, regardless of time.

### Proposed Algorithm Steps:

1.  **Track Correct Guess Order:**
    *   Continue to use the `correctGuessOrder` array in `TriviaRoomState` to record the `playerId` of each player as they submit a correct answer.
    *   This array should be cleared at the beginning of each new round.

2.  **Calculate Base Rank Score:**
    *   If the player is the **first** to guess correctly (`position === 0` in `correctGuessOrder`), their `base_score` is **10**.
    *   For subsequent players (`position > 0`), their `base_score` will be `max(1, 10 - position)`. This ensures the 2nd player gets 9, 3rd gets 8, and so on, down to a minimum of 1 point for the 10th and subsequent players.

3.  **Calculate Time Multiplier:**
    *   Determine the `elapsed_time` since the round started: `Date.now() - this.state.roundStartTime`.
    *   Calculate the `remaining_time`: `this.state.roundTime - elapsed_time`.
    *   Calculate the `time_ratio`: `remaining_time / this.state.roundTime`. This will be a value between 0 (no time left) and 1 (full time left).

4.  **Combine for Final Score:**
    *   `final_score = round(base_score * time_ratio)`
    *   Crucially, ensure the `final_score` is at least 1: `final_score = max(1, final_score)`

### Implementation Details:

*   **File to modify:** `apps/server/src/rooms/TriviaRoom.ts`
*   **Method to modify:** `handleCorrectGuess(playerId: string)`
*   **State to update:** `TriviaRoomState.correctGuessOrder` (ensure it's cleared at the start of each round in `startNewRound` or `endRound` before starting the next round).

### Example Scenarios (assuming a 30-second round):

*   **Player A (First Guesser):**
    *   Guesses at 28 seconds remaining (`time_ratio` ≈ 0.93).
    *   `base_score` = 10 (because they are first).
    *   `final_score` = 10 (first player always gets 10).

*   **Player B (Second Guesser):**
    *   Guesses at 20 seconds remaining (`time_ratio` ≈ 0.67).
    *   `base_score` = 9 (because they are second).
    *   `final_score` = `max(1, round(9 * 0.67))` = `max(1, round(6.03))` = **6 points**.

*   **Player C (Third Guesser):**
    *   Guesses at 5 seconds remaining (`time_ratio` ≈ 0.17).
    *   `base_score` = 8 (because they are third).
    *   `final_score` = `max(1, round(8 * 0.17))` = `max(1, round(1.36))` = **1 point**.

*   **Player D (Fourth Guesser):**
    *   Guesses at 1 second remaining (`time_ratio` ≈ 0.03).
    *   `base_score` = 7 (because they are fourth).
    *   `final_score` = `max(1, round(7 * 0.03))` = `max(1, round(0.21))` = **1 point**.
