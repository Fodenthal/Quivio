# Gemini CLI Guidelines for Quiv.io Repository

This document outlines the key principles, project-wide constraints, and specific rules for server, testing, and web development within the Quiv.io repository. These guidelines are adapted from the project's `.cursor/rules` and are intended to help the Gemini CLI agent work effectively and consistently with the existing codebase.

## Key Principles

- Break down tasks into small incremental steps instead of tackling everything at once.
- **Plan atomic steps that are small enough to be completed successfully in a single turn, avoiding complexity limits.**
- **Provide guidance for verification after complex changes.** For substantial tasks like feature additions or refactors, conclude by explaining how the user can manually verify the changes (e.g., UI steps to follow, or ideas for new automated tests).

## Project-wide Constraints
- Use `pnpm test` after implementing complex tasks
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

This document outlines a collaborative workflow designed to maximize the effectiveness of an AI agent for complex software development tasks like refactoring or feature implementation. The core philosophy is to treat the agent not as a black box, but as a pair programmer with a joint workflow that emphasizes semantic exploration, atomic execution, and continuous verification.

---

## **Phase 1: Deep Understanding & Strategic Planning**

The goal is to thoroughly understand the problem space before proposing any solutions.

### 1. **User States a Broad Goal**
The user provides a high-level objective with context.
*Example: "Currently, what is the architecture that allows creation of multiple rooms. If I open two tabs and create two different trivia room instances and then I create more tabs and join rooms using random room codes (because there is no check of room codes/game pins to join specific rooms yet) then I always join the first instance."*

### 2. **Agent Conducts Semantic Exploration**
**Key Pattern**: Use `codebase_search` extensively with varied queries to build comprehensive understanding:
- Start broad: *"How are trivia rooms created and managed on the server?"*
- Narrow down: *"What is the TriviaRoom class and how does it handle multiple room instances?"*
- Explore connections: *"How does room joining and game pin logic work?"*
- **Use parallel searches** for efficiency when exploring multiple aspects

### 3. **Agent Produces Comprehensive Analysis**
Create a detailed markdown document that includes:
- **The Current Architecture**: What exists today (with code references)
- **The Core Problem**: Clear diagnosis with specific examples
- **The Root Cause**: Why the current approach fails
- **Recommended Solution**: Target architecture description (no need for a lot of code)
- **Phased Implementation Plan**: Logical breakdown into sequential phases

### 4. **Iteration Until Strategic Alignment**
User reviews and confirms the agent's understanding before any code changes.

---

## **Phase 2: Atomic Execution Loop with Continuous Verification**

### **Core Principles for Atomic Steps**

#### **Step Sizing Guidelines**
- **Too Small**: Adding a single field ❌ 
- **Just Right**: Adding field + generation logic + integration ✅
- **Too Large**: Multiple unrelated changes or cross-cutting concerns ❌

#### **Good Atomic Step Examples**
- *"Add gamePin field to TriviaRoomState and implement generation logic in onCreate()"*
- *"Create GamePinRegistry service with collision detection and integrate with room lifecycle"*
- *"Implement client-side lookup-then-join pattern with proper error handling"*

#### **Communication Pattern**
Use consistent structure for clarity:
```
## Atomic Step X: [Clear Action Title]

**What I will do**: [Specific changes in technical detail]

**Why this step**: [Logical reasoning and dependencies]

**Verification**: [How user can confirm success]
```

### **Execution Loop**

#### 1. **Agent Proposes One Atomic Step**
- Define a **meaningful, verifiable action**
- Include specific technical details
- Explain why this step comes next
- Provide clear verification steps

#### 2. **User Confirms or Clarifies**
- Simple "Yes" to proceed
- Ask clarifying questions to prevent mistakes
- Suggest modifications if needed

#### 3. **Agent Executes with Maximum Efficiency**
- **Use parallel tool calls** whenever possible
- Fix any immediate issues (linting, TypeScript errors)
- **Test immediately** after significant changes
- Report completion with verification guidance

#### 4. **Immediate Issue Resolution**
**Key Pattern**: When tests break or user reports issues:
- Stop the planned sequence
- Create mini-atomic step to fix the issue
- Resume the main flow once stable

*Example: "Before we move onto the next step. Error handling: 1. Invalid game code does not log, room not found does log 2. Is it normal to get actual errors in the dev environment when this happens 3. When a wrong game code is entered, user is sent to the connecting screen..."*

#### 5. **Continuous Verification**
After each step:
- **Immediate feedback**: Agent reports what was completed
- **Verification guidance**: Specific commands to run (tests, compilation)
- **Expected outcomes**: What success looks like
- **User confirms**: Success or provides exact error messages

### **Error Handling Protocol**

When issues arise:
1. **User provides exact error messages** (complete output)
2. **Agent creates focused fix step** (not part of main plan)
3. **Fix is implemented and verified** before continuing
4. **Main workflow resumes** once stable

---

## **Communication Standards**

### **Agent Response Structure**
- **Clear headings** with step numbers
- **Emojis for status** (✅ ❌ 🎯 🔍)
- **Technical specifics** with code references
- **Verification commands** that user can copy-paste

### **Progress Tracking**
- Update user on completion: *"✅ Atomic Step X Complete"*
- Summarize what was achieved
- Preview next logical step
- Maintain momentum with clear next actions

---

## **Quality Patterns That Emerged**

### **Semantic Search Strategy**
1. **Start exploratory**: Broad questions to understand the domain
2. **Narrow systematically**: Focus on specific implementation areas
3. **Use parallel searches**: Multiple related queries simultaneously
4. **Verify assumptions**: Search for edge cases and existing patterns

### **Test-Driven Development**
- **Run tests after every substantial change**
- **Fix broken tests immediately** (don't accumulate technical debt)
- **Use test feedback** to validate step completion

### **Error Prevention**
- **Comprehensive error handling** from the start
- **User experience focus**: Inline errors, not browser alerts
- **Graceful degradation**: Handle missing data elegantly

### **Parallel Tool Execution**
Default to parallel tool calls unless sequential dependencies exist:
- Multiple file reads
- Parallel searches with different patterns
- Simultaneous information gathering

---

## **Success Metrics**

A successful session demonstrates:
- **Steady progress**: Each step builds meaningfully on the last
- **No regression**: Tests remain passing throughout
- **Clear communication**: Both parties understand next steps
- **User confidence**: User can verify each change independently
- **Maintainable result**: Clean, tested, documented implementation

---

*This workflow captures patterns from successful complex implementations. The key is balancing meaningful progress with reliable execution through careful step sizing and continuous verification.*