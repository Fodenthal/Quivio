# Gemini CLI Guidelines for Quiv.io Repository

This document outlines the key principles, project-wide constraints, and specific rules for server, testing, and web development within the Quiv.io repository. These guidelines are adapted from the project's `.cursor/rules` and are intended to help the Gemini CLI agent work effectively and consistently with the existing codebase.

## Key Principles

- Break down tasks into small incremental steps instead of tackling everything at once.
- **Plan atomic steps that are small enough to be completed successfully in a single turn, avoiding complexity limits.**
- **Provide guidance for verification after complex changes.** For substantial tasks like feature additions or refactors, conclude by explaining how the user can manually verify the changes (e.g., UI steps to follow, or ideas for new automated tests).

## Project-wide Constraints

- **Use `pnpm test` after each implementation** (pnpm dev or pnpm run build)
- **Use named exports** (`export const foo`) not `export default` (prevents tree-shaking issues)
- **Throw `Error` objects** never strings (enables proper stack traces)

### TypeScript Strictness
- Enable `strict`, `noImplicitOverride`, `exactOptionalPropertyTypes` (catches runtime errors at compile time)
- Always provide explicit return types on exported functions (improves API clarity)

## Server Rules (Colyseus Room Logic & Schema)

### Schema & State Management
- **Every shared state class extends `@colyseus/schema`** never plain objects (enables efficient patches)
- **Use `MapSchema`/`ArraySchema` for collections** enables minimal network patches
- **Only mutate state in `setSimulationInterval` ticks or `onMessage` handlers** (prevents race conditions and sync issues)

### Room Architecture
- **Keep `Room` class thin** heavy logic lives in helper modules (`services/`, `lib/`) (improves testability)
- **Broadcast via `this.broadcast(type, data)` or `client.send`** never leak state refs (prevents memory leaks)
- **Use lowercase snake-case for room identifiers** e.g. `"trivia_room"` (consistency)

### Code Quality
- **Prefer `async/await`** avoid raw `.then()` chains (better error handling)
- **Keep functions ≤40 lines** extract helpers if larger (improves maintainability)

### Environment & Presence
- **Use `RedisPresence` in production** fall back to `LocalPresence` in tests (scalability)
- **Handle client disconnect gracefully** clean up state and reassign hosts

### Message Handling
- **Validate all incoming messages** check types and structure before processing
- **Use `MSG` constants from `@shared`** for message type safety
- **Handle malformed payloads gracefully** ignore or send error response

## Testing Rules

### Test Organization
- **Place unit tests in `apps/**/test/**/*.test.ts`** (consistent structure)
- **Name tests in plain English** e.g. `"should award points for correct guess"` (readable test reports)
- **One test file per source file** match naming: `GameView.tsx` → `GameView.test.tsx`

### Testing Tools by Domain
- **Use Vitest + RTL + jsdom for frontend** component and DOM tests
- **Use Mocha + `@colyseus/testing` for backend** room and schema tests
- **Use Node `assert.*` for assertions** avoid Chai (consistency, built-in)

### Test Lifecycle & Cleanup
- **Always call `await colyseus.cleanup()` in `beforeEach`** for server tests (prevents test pollution)
- **Use `afterEach` for cleanup** dispose components, clear mocks
- **Run tests non-interactively** use `vitest run`, set `CI=1` (reliable CI/CD)

### Test Quality
- **Avoid `console.log` debugging** use proper assertions and test output
- **Test error cases and edge conditions** not just happy path
- **Mock external dependencies** network calls, timers, file system

## Web Rules (Next.js + Tailwind)

### React Components
- **Default to React Server Components** (better performance, SEO)
- **Add `"use client"` only when needed** for event handlers or browser APIs
- **Group page code under `app/<route>/`** with:
  - `page.tsx` – top-level component
  - `components/` – local UI pieces
  - `actions.ts` – server actions if needed

### Styling & UI
- **Use shadcn/ui primitives** (`Button`, `Card`, `Dialog`) never fork library code
- **Use Tailwind utility classes only** no inline `style={{ … }}` (prevents inconsistency)
- **Use `clsx` or `class-variance-authority`** for dynamic classes (avoid string concat)
- **Optimize mobile first** test in 375px viewport (majority of users)

### Forms & Validation
- **Validate form inputs with Zod** narrow types immediately after `zod.safeParse`
- **Use React hooks for client state** prefer `useOptimistic`/`useRef` over global state

### Code Organization
- **Prefer `async/await`** avoid raw `.then()` chains (better error handling)
- **Keep functions ≤40 lines** extract helpers if larger (improves maintainability)
- **Import order**: ① Node built-ins ② third-party ③ workspace packages (`@shared`) ④ relative (`./`)
- **Document conditional rendering** with JSDoc rationale
- **Document loading/error states** for async operations

### A Guide to Effective Agent-Assisted Development

This document outlines a collaborative workflow designed to maximize the effectiveness of an AI agent for complex software development tasks like refactoring or feature implementation. The core philosophy is to treat the agent not as a black box, but as a pair programmer that requires clear guidance and a tight feedback loop.

---

### **Phase 1: High-Level Strategy & Alignment**

The goal of this phase is to agree on the "what" and "why" before any code is written.

1.  **User States a Broad Goal:** The user provides a high-level objective.
    *   *Example: "The connection state logic is duplicated everywhere. Can you analyze it and help me fix it?"*

2.  **Agent Analyzes & Proposes a Strategic Plan:** The agent uses its tools (`glob`, `search_file_content`, `read_file`) to analyze the codebase. It then produces a high-level markdown document that outlines:
    *   **The Problem:** A clear diagnosis of the issue with code snippets.
    *   **The Recommended Solution:** A description of the target architecture (e.g., "Create a custom hook," "Extract a utility function").
    *   **A Phased Implementation Plan:** A logical breakdown of the work into large, sequential phases (e.g., Phase 1: Create Hook, Phase 2: Refactor Component A, etc.).

3.  **Iteration Until User Approves the Strategy:** The user reviews the agent's plan. This is the crucial alignment step. The user confirms that the agent's understanding of the problem and its proposed solution are correct before any code is modified.

---

### **Phase 2: The Atomic Execution Loop**

This is the core of the workflow. Instead of executing the entire strategic plan at once, we loop through it one tiny piece at a time.

1.  **Agent Proposes One Atomic Step:** The agent must define the **smallest possible, verifiable action** it will take next, based on the phased plan.
    *   **Good:** *"I will now create the file `useGameConnection.ts` with the basic hook structure."*
    *   **Good:** *"I will now remove the `useState` for `gameClient` from `GameLayout.tsx`."*
    *   **Bad:** *"I will now create the file `useGameConnection.ts`, refactor GameLayout.tsx.", and extract the MapSchema conversoin into its own utility file* (This is too large and likely to fail).

2.  **User Confirms or Clarifies:** The user gives a simple "Yes, proceed" or, critically, asks clarifying questions to prevent mistakes.
    *   *Example: "Wait, when you create the hook, will it include the state conversion logic?"* This allows the agent to refine its atomic step.

3.  **Agent Executes the Single Step:** The agent runs the necessary tool calls (`write_file`, `replace`, etc.) for **only** the approved atomic step.

4.  **Agent Reports & Suggests Verification:** After the step is complete, the agent reports what it did and, per our key principles, provides clear instructions on how the user can verify the change.
    *   *Example: "I have created the file. You can verify that the new `useGameConnection.ts` file exists in the `hooks` directory. No functionality should have changed yet."*
    *   *Example: "I have completed the refactor. Please run the test suite. I expect the `GameLayout` tests to fail, which will confirm the old logic has been removed."*

5.  **User Verifies & Provides Feedback:** The user performs the verification step. If there are errors (linting, TypeScript, failing tests), the user pastes the **exact, complete error messages** back to the agent.

6.  **Repeat:** The loop continues with the agent proposing the next atomic step.

By following this workflow, we turn a large, complex task into a series of predictable, low-risk steps, ensuring we always make forward progress.
