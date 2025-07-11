# Gemini CLI Guidelines for PopReplay Repository

This document outlines the key principles, project-wide constraints, and specific rules for server, testing, and web development within the PopReplay repository. These guidelines are adapted from the project's `.cursor/rules` and are intended to help the Gemini CLI agent work effectively and consistently with the existing codebase.

## Key Principles

- Break down tasks into small incremental steps instead of tackling everything at once.

## Project-wide Constraints

- **Use `pnpm test` after each implementation** (no need for pnpm run build)
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

### Commands
- **Run full test suite** with `pnpm test` from root (validates entire system)
- **Run specific app tests** with `pnpm test` in `apps/web` or `apps/server`

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
