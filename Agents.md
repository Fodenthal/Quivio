# Agents Playbook

Guidance for anyone (human or LLM) iterating inside the Quivio monorepo. Use this as a quick refresher on how the repo is organised, how to ship changes fast, and what quality bars to keep in mind.

## Monorepo At a Glance
- `apps/server` – Colyseus game server (`@getmoney/server`). Holds all room logic (notably `TriviaRoom`), AI question generation, persistence adapters, load tests, and Mocha-based tests under `test/`.
- `apps/web` – Next.js 15 app (`quivio`). Uses the App Router, React 19, Tailwind, and connects to the Colyseus server through `GameClient` and contexts. Client tests live in `src/test/` and use Vitest + Testing Library.
- `packages/shared` – TypeScript-only workspace for shared schema/types/messages consumed by both server and client.
- `scripts/` – One-off utilities (e.g., poster ingestion, deployment helpers). If a script mutates production data, document any preconditions here.
- `pnpm-workspace.yaml` – pnpm workspaces coordinate builds; always use `pnpm`, not `npm`/`yarn`.

## Local Setup & Common Commands
| Need | Command |
| --- | --- |
| Install deps | `pnpm install`
| Run both apps w/ hot reload | `pnpm dev` (spawns server + web; relies on Colyseus port 2567)
| Server only (watch) | `pnpm --filter @getmoney/server dev`
| Web only (Next dev) | `pnpm --filter quivio dev`
| Type-check + build shared | `pnpm --filter @shared build`
| Server tests (Mocha) | `pnpm --filter @getmoney/server test`
| Web tests (Vitest) | `pnpm --filter quivio test`
| Full workspace test sweep | `pnpm test`

Keep `.env` secrets out of git. Sample env files live in `apps/server/.env.example` and `apps/web/.env.local` – copy and adjust as needed.

## Default Iteration Loop
1. **Plan** – Read the existing implementation (look for manager classes in `apps/server/src/rooms/TriviaRoom/**/*` and React components in `apps/web/src/app/components`). Update the work plan whenever scope changes.
2. **Implement** – Stay within the relevant workspace:
   - Server: prefer pure helpers inside `TriviaRoom` subfolders to keep rooms slim. Reuse `QuestionBufferManager`, `RoundManager`, etc., rather than duplicating logic.
   - Web: colocate UI state in hooks/context (`GameConnectionContext`, `useLocalTimer`, etc.) and avoid reaching into Colyseus state directly from random components.
3. **Test** – Targeted tests first (Mocha or Vitest), then broader `pnpm test` if the change is cross-cutting.
4. **Manual QA** – For gameplay changes, spin up `pnpm dev`, open two browser tabs, and smoke the relevant flows (joining, round start/end, AI question load, uploads, etc.).
5. **Summarise** – Note touched files + rationale, call out risks or follow-ups.

## Coding Guidelines
- **TypeScript everywhere** – do not introduce plain JS. Leverage existing types from `@shared` before redefining shapes.
- **Keep state mutations centralised** – server state changes should flow through dedicated managers (`GuessManager`, `SettingsManager`, `RoundManager`). On the client, convert Colyseus state via `convertColyseusState` and consume from React context to avoid stale references.
- **Async discipline** – server code runs inside Colyseus rooms; avoid long blocking tasks in the request/turn loop. Push heavy work to background `void ...` tasks only when safe.
- **Logging** – Prefer the room-level logger (`this.log`) or helper `Logger` utilities. For temporary debugging, use structured logs, then remove before merging.
- **Shared constants** – `packages/shared/index.ts` defines message enums (`MSG`), schema interfaces, etc. Update both TS + `.d.ts` when adding new top-level fields.
- **Styling** – The web app uses Tailwind classes; favour composable utilities over bespoke CSS.

## Testing Expectations
### When to Add/Update Tests
- **Bug fixes** – Reproduce the bug in a test (server Mocha spec or client Vitest test) so it never regresses.
- **New gameplay behaviour** – Cover in `apps/server/test/TriviaRoom_test.ts` or a new spec under `apps/server/test`. Use `@colyseus/testing` helpers for room lifecycle where possible.
- **New UI behaviour** – Add or extend tests in `apps/web/src/test/components/*.test.tsx`. Follow patterns in `GameView.test.tsx` for complex flows.
- **Utility functions** – Co-locate unit tests near the module if there’s already a spec suite; otherwise place them under `apps/server/test` or `apps/web/src/test` mirroring the file tree.

### How to Test
- **Server** (Mocha): tests run in Node with tsx loader. Keep them deterministic; avoid real Supabase unless explicitly running an integration scenario (requires env vars). For database interactions, prefer fakes or the SQLite fallback where feasible.
- **Web** (Vitest): configure the DOM via `apps/web/src/test/setup.ts`. Use Testing Library queries (`screen.getByRole`, etc.) and avoid snapshot tests unless the render is trivial. For hooks/components relying on the Colyseus client, mock `GameClient` methods.
- **Shared package**: simple `tsc` build acts as type regression; add additional tests in the consumer (server/web) if runtime behaviour matters.

### Additional QA Tools
- **Load tests**: `apps/server/loadtest/*.ts` run via `pnpm --filter @getmoney/server loadtest:trivia` to benchmark new mechanics.
- **Scripts**: ingestion or migration scripts live in `apps/server/src/scripts` and `scripts/`. If you create a new script, include usage notes at the top and ensure it is idempotent.

## Deployment & Environments
- Render configuration lives in `render.yaml`. Mind environment variable names when adding new secrets.
- Server expects Google Gemini + Supabase credentials (`GEMINI_API_KEY`, Supabase keys). Web uses Supabase public anon key via `.env.local`.
- When adding env vars, update both `.env.example` files and deployment configs.

## Working with Questions & Assets
- AI question generation runs through `GeminiService` → `QuestionBufferManager` → `PromptLoader`. Reuse these layers; don’t fetch or mutate prompt data directly from the room or client.
- User-uploaded assets flow through `apps/web/src/app/api/question-uploads`. Follow existing validation & Supabase storage utilities (`imageUpload.ts`).
- When touching image handling, ensure you update both server state and client converters (`gameStateConverter.ts`) so metadata stays in sync.

## Performance & Observability Tips
- **Server**: keep the question buffer full (`QuestionBufferManager`). If you change buffer sizes, update metrics reporting. Avoid blocking the Colyseus clock thread.
- **Client**: heavy computations should live in memoised hooks. Prefer streaming updates via context rather than prop drilling complex Maps.
- **Logging**: ensure new warnings/errors include enough context (room ID, topic, etc.) to debug in production logs.

## Files Worth Skimming Before Big Changes
- `apps/server/src/rooms/TriviaRoom.ts` (round lifecycle)
- `apps/server/src/rooms/TriviaRoom/question/QuestionBufferManager.ts` (prefetching & pools)
- `apps/web/src/app/components/GameView.tsx` (primary gameplay UI)
- `apps/web/src/utils/gameStateConverter.ts` (state hydration bridge)
- `apps/web/TESTING.md` (Vitest setup details)

# ExecPlans

When writing complex features or significant refactors, use an ExecPlan (as described in PLANS.md) from design to implementation.

## Contributing Hygiene
- Keep commits scoped; avoid mixing server & web changes unless necessary to keep types in sync.
- Update documentation (this file, README snippets, env examples) whenever tooling or workflows change.
- Flag follow-up work or risky areas in the PR summary; open TODO issues if you cannot address them immediately.

Happy shipping! 🎯
