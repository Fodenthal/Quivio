# Plan for the "Round Ended" UI

This document outlines the implementation plan for redesigning the UI that appears during the transition period after a round ends and before the next one begins.

## Current State

Currently, when the round ends (`phase === "round-ended"`), the `Answer Input Section` disappears entirely because its render condition `(phase === "playing" || phase === "paused")` becomes false. The `Question Display Panel` changes to show the correct answer, but the lower section of the `Game Panel` becomes empty, causing a layout shift.

## The Goal

The goal is to create a more informative, stable, and polished transition between rounds.

1.  **`Question Display Panel`**: When the round ends, this panel should be the primary focus, displaying the correct answer in a large, centered format.
2.  **`Answer Input Section`**: This container should **remain visible** when the round ends to prevent layout shifts. Its content will provide personalized feedback to the player based on their performance in the round.
    *   **Case A (Player was correct):** The container should continue to display the same `"{answer}" is correct!` message, creating a seamless experience.
    *   **Case B (Player was incorrect or didn't answer):** The container should display a random, static encouraging message from a predefined list (e.g., "Message A," "Message B," etc.).

## Implementation Plan

All changes will be made within the `GameView.tsx` component.

1.  **Modify the `Answer Input Section`'s Render Condition:**
    *   The condition that wraps the `Answer Input Section` will be changed from `(phase === "playing" || phase === "paused")` to `(phase === "playing" || phase === "paused" || phase === "round-ended")`. This will keep the container visible during the round transition.

2.  **Create New Logic Inside the `Answer Input Section`:**
    *   A new check, `if (phase === 'round-ended')`, will be added to handle the new UI state.
    *   Inside this block, the logic will be:
        *   **If the player's guess was correct:** Render the existing `"{answer}" is correct!` message.
        *   **If the player was incorrect or did not answer:**
            *   A `useMemo` hook will be used to define a static array of encouraging messages (e.g., `['Message A', 'Message B', ... 'Message F']`).
            *   A second `useMemo` hook, dependent on `gameState.currentRound`, will be used to select one of these messages at random at the start of each round-end phase. This ensures the message is consistent during the transition.
            *   A `<p>` tag will render the selected random message in the standard text color.

3.  **Refactor the `Question Display Panel`:**
    *   The logic for displaying the correct answer will be simplified to check `if (phase === 'round-ended')`.
    *   The content will be styled as defined in `fixes.md`: a small "The answer was:" subheading followed by a large, centered display of the `gameState.correctAnswer`.

This plan will result in a much more polished and informative experience between rounds. The player will see the correct answer clearly in the main display while also getting personalized feedback on their own performance in the section below.
