# GameView Component Fixes & Improvements

This document lists the required changes for the `GameView.tsx` component to improve the user experience during gameplay.

## To-Do List:

- [ ] **1. Stabilize GameView Layout:**
  - **Goal:** Prevent the `GameView` window from resizing between different game states by setting its size based on the maximum possible question length.
  - **Action:** The prompt display area should have a fixed `min-height`. This height should be calculated to comfortably fit a maximum-length question (approx. 65 tokens / 280 characters) without causing the container to resize, even on smaller screens. This ensures layout stability for all questions, short or long.

- [ ] **2. Enlarge Prompt Display Area:**
  - **Goal:** Maximize the space available for displaying the trivia question.
  - **Action 1:** Remove the interstitial component/view that currently displays the "Target Score" and the previous round's "Correct Answer" between rounds.
  - **Action 2:** Expand the prompt display size to be fixed at around the height of the bottom of the
  chat component's grey window (the one that displays the messages)

- [ ] **3. Implement New Correct Guess Flow:**
  - This involves two distinct state changes for a player who has just answered correctly.
  - **3.1. During the Round (Immediate Feedback):**
    - **Goal:** Give the user instant confirmation of their correct answer and prevent further guesses.
    - **Action:** When a player submits a correct guess, the guess input form should be replaced with a clear confirmation message, such as "You got it!". This state should persist until the round timer ends.
  - **3.2. After the Round (Answer Reveal):**
    - **Goal:** Use the main prompt area to clearly display the correct answer to all players after the round has concluded.
    - **Action:** Once the round ends, the prompt display window should be updated to show the following format:
      - A small subheading: `The answer was:`
      - A large, prominent heading below it displaying the `{correctAnswer}`.
