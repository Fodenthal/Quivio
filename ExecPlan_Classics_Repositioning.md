# Reposition Quivio into a Classics Learning and Competition Platform

This ExecPlan is a living document. The sections Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date as work proceeds.

This plan follows PLANS.md in the repo root.

## Purpose / Big Picture

Turn Quivio from a general-purpose trivia site into a focused Classics product where people can learn Greek and Roman history, mythology, famous figures, and possibly language or vocabulary, then prove what they know in solo or multiplayer quizzes. After this change, a new visitor should land on a homepage that clearly offers two paths: Learn Mode for structured lessons and Quiz Mode for competition. The homepage should no longer include the long generic marketing stack that currently starts at the “What is Quivio?” block.

The user-visible outcome is a cleaner product with a sharper thesis. A visitor should be able to understand, within a few seconds, that Quivio is about Classics, choose a topic, start learning, or join a quiz. A returning user should be able to progress through lessons and later use the existing room system to compete on the same subject areas.

## Progress

- [x] (2026-04-05 00:00 America/Chicago) Reviewed the current homepage composition in `apps/web/src/app/components/Homepage/index.tsx` and confirmed that everything from the “What is Quivio?” section downward should be removed in the first implementation pass.
- [x] (2026-04-05 00:05 America/Chicago) Reviewed the current multiplayer quiz architecture in `apps/server/src/rooms/TriviaRoom.ts`, `apps/web/src/hooks/useGameConnection.ts`, `apps/web/src/app/game/[gamePin]/page.tsx`, and `packages/shared/index.ts`.
- [x] (2026-04-05 00:10 America/Chicago) Chose a refactor strategy instead of a full rewrite. The current room and game loop are good enough to reuse for Quiz Mode.
- [x] (2026-04-05 00:40 America/Chicago) Removed the long lower homepage marketing stack beginning at “What is Quivio?” and replaced the top of the homepage with Classics-focused Learn Mode and Quiz Mode positioning.
- [x] (2026-04-05 00:45 America/Chicago) Added a shared Classics content model in `packages/shared/index.ts` and static track, lesson, and vocabulary data under `apps/web/src/content/classics`.
- [x] (2026-04-05 01:00 America/Chicago) Built a Learn Mode MVP with `/learn`, `/learn/[track]`, and `/learn/[track]/[lesson]`, including local progress tracking and checkpoint-based lesson completion.
- [ ] Constrain Quiz Mode to curated Classics topics and remove the “anything” positioning from the product.
- [ ] Decide whether solo quiz play should reuse the multiplayer room flow or live in a dedicated solo route.
- [ ] Add progress tracking for lesson completion and topic mastery.
- [ ] Add or update tests for homepage behavior, Learn Mode flows, and Classics quiz configuration.

## Surprises & Discoveries

- Observation: The homepage is already split into a practical upper section and a long lower marketing section. This means the requested cleanup is low risk and can be done without redesigning the entire page in the first pass.
  Evidence: `apps/web/src/app/components/Homepage/index.tsx` renders the lobby-oriented content first, then begins a new section with the label “What is Quivio?” and continues with blog, testimonials, FAQ, and editorial material.

- Observation: The strongest reusable asset in the codebase is the multiplayer trivia stack, not the current public-facing messaging.
  Evidence: The room lifecycle, settings, guessing, rounds, and client synchronization are already modularized in `apps/server/src/rooms/TriviaRoom/*` and consumed from the web app through `useGameConnection`.

- Observation: Learn Mode does not exist as a true product feature today. It will need new routes, new data structures, and new user progress state rather than a cosmetic rewrite of current quiz screens.
  Evidence: The web app has pages for the homepage, game page, blog, guides, and question upload, but no lesson, course, or mastery routes under `apps/web/src/app`.

## Decision Log

- Decision: Do not start from a blank repository or new app.
  Rationale: The current Quivio monorepo already contains the hardest technical part for Quiz Mode: real-time rooms, joining by PIN, shared game state, and a working web client. Rebuilding this would add cost without improving the product idea.
  Date/Author: 2026-04-05 / Codex

- Decision: Treat the work as a product repositioning plus a new Learn Mode feature set.
  Rationale: The existing product is structurally close to the desired Quiz Mode but far from the desired Learn Mode. This makes a mixed strategy correct: reuse where the fit is strong, build new surfaces where the product is genuinely different.
  Date/Author: 2026-04-05 / Codex

- Decision: Make homepage cleanup the first implementation step.
  Rationale: The user explicitly wants everything from and below the “What is Quivio?” block removed regardless of broader product decisions. This creates a clean base for the subsequent Classics-focused redesign.
  Date/Author: 2026-04-05 / Codex

- Decision: Use curated Classics topics rather than open-ended “trivia on anything” as the default product model.
  Rationale: The value proposition depends on subject authority and educational coherence. A Classics product needs topic structure, not arbitrary prompt generation as the main story.
  Date/Author: 2026-04-05 / Codex

- Decision: Defer Latin or Greek language learning until the core History, Mythology, Famous Figures, and Vocabulary tracks are stable.
  Rationale: Language learning has a different pedagogical shape and will expand scope quickly. It is safer to reserve it as a later extension, even if the data model should leave room for it.
  Date/Author: 2026-04-05 / Codex

## Outcomes & Retrospective

This document currently captures the design direction and implementation order only. No production code has been changed as part of this ExecPlan yet. The main outcome of this planning pass is clarity: Quivio should not be rewritten from scratch, the homepage cleanup should happen first, and the product should evolve through a phased build that reuses Quiz Mode while adding a net-new Learn Mode.

Update: the first implementation slice now exists. The homepage has been narrowed to Classics messaging, the long marketing tail has been removed, and Learn Mode routes now exist with local progress. Quiz Mode has been narrowed at the homepage and room-creation level by using curated Classics tracks in the create-room flow, but server-side question sourcing is still only partially aligned with the new taxonomy.

## Context and Orientation

Quivio is a pnpm monorepo with three main areas relevant to this work.

`apps/web` is the Next.js frontend. The root homepage entry is `apps/web/src/app/page.tsx`, which renders `apps/web/src/app/HomePageClient.tsx`. The visible homepage layout and most of the current public-facing messaging live in `apps/web/src/app/components/Homepage/index.tsx`. The real-time game route is `apps/web/src/app/game/[gamePin]/page.tsx`, and the core game interface is `apps/web/src/app/components/GameView.tsx`.

`apps/server` is the Colyseus multiplayer server. The main room implementation is `apps/server/src/rooms/TriviaRoom.ts`. Supporting logic is broken into managers inside `apps/server/src/rooms/TriviaRoom/`, including question buffering, rounds, guessing, settings, and players.

`packages/shared` contains the TypeScript types shared by both web and server. Right now, `packages/shared/index.ts` defines the room message constants, prompt types, and game state. If Learn Mode introduces lesson, track, or mastery types that must be shared between client and server, they should be added here or in a closely related shared module.

In plain language, a “room” here means a live multiplayer quiz session running on the server. A “route” means a page URL in the Next.js app. A “content model” means the data structure that describes topics, lessons, vocabulary, quizzes, and progress. This repository has a room model already. It does not yet have a content model for structured learning.

The current homepage is one file with several stacked sections. The user has requested that the implementation remove the long lower marketing section beginning with “What is Quivio?” in `apps/web/src/app/components/Homepage/index.tsx`. This is the correct first step because it is explicit, easy to verify, and unblocks the redesigned Classics homepage.

## Plan of Work

The work should proceed in six milestones, each one leaving the product in a coherent state.

### Milestone 1: Homepage Cleanup and Repositioning

The first milestone removes noise and establishes the new product framing without changing the multiplayer engine. Edit `apps/web/src/app/components/Homepage/index.tsx` so the homepage ends after the core lobby and action panels rather than continuing into the “What is Quivio?” and marketing sections. Remove the arrays that only exist to support those deleted sections, such as the blog teasers, testimonials, FAQs, use cases, and value proposition cards, unless some of them are deliberately repurposed for the new Classics homepage.

After the removal, rewrite the remaining top-of-page copy so it no longer says “Trivia on anything, with anyone, in seconds.” The short `InfoPanel` in `apps/web/src/app/components/Homepage/InfoPanel.tsx` should be updated to describe the new thesis in one sentence. The homepage should present two clear primary actions: Learn Mode and Quiz Mode. This can begin as a layout change inside the existing homepage before new routes fully exist. If the Learn Mode routes are not yet implemented, the Learn Mode call to action can temporarily point to a placeholder route that is introduced in Milestone 3.

This milestone is complete when the homepage no longer contains the long generic marketing stack, and a visitor can tell that the product is about Classics rather than general trivia.

### Milestone 2: Shared Classics Taxonomy and Content Model

The second milestone creates the vocabulary the app will use to talk about educational content. Add new shared types for topic organization, lesson metadata, quiz collections, vocabulary lists, and progress records. These types should live in `packages/shared` so the same definitions can be used by the web app, and later by server APIs or persistence layers if needed.

The initial taxonomy should be explicit and finite. Use top-level tracks such as `greek-history`, `roman-history`, `mythology`, `famous-figures`, and `vocabulary`. Each track should contain subtopics. For example, `famous-figures` can hold `generals`, `kings`, and `philosophers`. Keep Latin or Greek language learning out of the first executable scope, but make the type definitions flexible enough to add a `language` track later.

At the same time, decide where initial content lives. For the first pass, prefer static TypeScript data files inside `apps/web/src/content/classics` or a similar path rather than building a full database-backed content system. This keeps implementation fast and reviewable. A later migration to persisted content is possible once the product shape is proven.

This milestone is complete when the repository has a stable, shared definition of what a Classics topic, lesson, vocabulary set, and progress record are.

### Milestone 3: Learn Mode MVP

The third milestone introduces the first version of Learn Mode as a route-based product area in the web app. Add routes such as `apps/web/src/app/learn/page.tsx`, `apps/web/src/app/learn/[track]/page.tsx`, and `apps/web/src/app/learn/[track]/[lesson]/page.tsx`. The Learn landing page should show the available tracks. A track page should show the lesson sequence. A lesson page should display the lesson content and one or more checkpoint interactions.

Do not try to match the full complexity of Duolingo in the first implementation. The initial lesson format should be simple and repeatable: a short explanation, a few key facts or terms, an example or story, and a checkpoint question or review block. A user should be able to complete a lesson and mark it done. The completion state can initially be stored in local state or browser storage if account-backed progress does not exist yet.

The main product test for this milestone is straightforward: a user can click Learn Mode from the homepage, open a topic, complete a lesson, and see visible progress. That is enough to prove the new product direction before more advanced pedagogy is added.

### Milestone 4: Quiz Mode Narrowing and Classics Alignment

The fourth milestone adapts the existing multiplayer quiz engine to the new subject focus. Keep the existing room architecture in `apps/server/src/rooms/TriviaRoom.ts` and the web connection flow in `apps/web/src/hooks/useGameConnection.ts`, but change the setup flow so quiz topics are selected from the curated Classics taxonomy rather than from an open-ended or generic pool.

This milestone may require updates in several places. The homepage create-room flow in `apps/web/src/app/components/Homepage/index.tsx` and `apps/web/src/app/HomePageClient.tsx` should pass Classics topics into room creation. The room state and messages in `packages/shared/index.ts` may need small adjustments so topic identifiers are stable and specific. The question sourcing path in `apps/server/src/rooms/TriviaRoom/question/QuestionBufferManager.ts` and `PromptLoader.ts` should be reviewed to ensure it can reliably serve Classics questions without leaning on generic or uncontrolled prompt generation.

Accuracy matters more in this product than breadth. For that reason, the implementation should prefer curated question banks, or at least curated topic rails, over a purely open AI-generated question path. If AI remains in the system, it should be framed as a controlled assistant to content creation rather than the core product promise.

This milestone is complete when a user can start a room for a specific Classics topic and the product language, setup flow, and visible categories all reflect the new identity.

### Milestone 5: Solo Quiz and Progress Layer

The fifth milestone connects learning and competition. Add a solo quiz path so a user can practice without waiting for another player. There are two valid implementation options, and this plan chooses the lower-risk option first: reuse the existing room mechanics by creating a one-player room under the same infrastructure. This avoids building a second quiz engine before the product needs it.

Once solo play exists, add visible progress indicators that connect Learn Mode and Quiz Mode. Examples include track completion, mastered lessons, quiz streaks, or topic badges. These can begin as lightweight client-side state if user accounts and persistence are not yet ready. What matters is that the product starts to answer the “show off your knowledge” part of the idea.

This milestone is complete when a user can learn a topic, then immediately practice or compete on it, and the product reflects that progress somewhere visible.

### Milestone 6: Hardening, Testing, and Migration Cleanup

The sixth milestone removes temporary seams and makes the new direction reliable. Add tests for the homepage mode selection, Learn Mode navigation, and topic rendering in the web app. Add server-side tests or adaptations for Classics-only quiz configuration. Remove or de-emphasize leftover generic marketing and generic-trivia language. Update metadata in `apps/web/src/app/page.tsx` so the site title and description match the new product.

Do not attempt a broad content migration from the old generic trivia positioning. This is a product repositioning, not a content preservation exercise. Keep only the pieces that still support the new idea.

This milestone is complete when the product feels internally consistent: homepage, learn routes, quiz routes, metadata, and tests all describe the same thing.

## Concrete Steps

Work from the repository root:

    cd /Users/felixodenthal/Quivio

For Milestone 1, edit:

    apps/web/src/app/components/Homepage/index.tsx
    apps/web/src/app/components/Homepage/InfoPanel.tsx
    apps/web/src/app/page.tsx

The initial verification command for homepage changes is:

    pnpm --filter quivio test

If the existing test suite is too broad for rapid iteration, add or run focused Vitest tests in `apps/web/src/test/components` and then run:

    pnpm --filter quivio test -- --runInBand

For Milestone 2, add shared and content files such as:

    packages/shared/index.ts
    apps/web/src/content/classics/tracks.ts
    apps/web/src/content/classics/lessons.ts
    apps/web/src/content/classics/vocabulary.ts

For Milestone 3, add Learn Mode routes:

    apps/web/src/app/learn/page.tsx
    apps/web/src/app/learn/[track]/page.tsx
    apps/web/src/app/learn/[track]/[lesson]/page.tsx

For Milestone 4, update the quiz setup and topic flow in:

    apps/web/src/app/HomePageClient.tsx
    apps/web/src/app/components/Homepage/index.tsx
    apps/server/src/rooms/TriviaRoom.ts
    apps/server/src/rooms/TriviaRoom/question/QuestionBufferManager.ts
    packages/shared/index.ts

For Milestone 5, add solo quiz entrypoints and progress state in whichever of the following ends up being the thinnest integration:

    apps/web/src/app/quiz/page.tsx
    apps/web/src/app/quiz/[track]/page.tsx
    apps/web/src/utils or apps/web/src/contexts for local progress state

For validation during implementation, use:

    pnpm --filter @shared build
    pnpm --filter quivio test
    pnpm --filter @getmoney/server test

For manual QA during later milestones, run:

    pnpm dev

Then verify in the browser that the homepage reflects Classics positioning, the Learn Mode routes load, and a room can still be created and joined for a curated Classics topic.

## Validation and Acceptance

Milestone 1 is accepted when the homepage ends above the old “What is Quivio?” block and no longer shows the blog, FAQ, testimonial, or editorial sections that used to follow it.

Milestone 1 is also accepted when the remaining copy clearly describes Classics learning and quiz competition rather than “multiplayer trivia on anything.”

Milestone 2 is accepted when the repository has stable shared types and local content definitions for tracks, lessons, and vocabulary, and the web app can render them without ad hoc string arrays scattered through components.

Milestone 3 is accepted when a user can open `/learn`, choose a track, open a lesson, complete the lesson, and see a visible completion state.

Milestone 4 is accepted when a user can create or join a quiz for a curated Classics topic and the room setup uses that taxonomy consistently.

Milestone 5 is accepted when a user can practice alone or compete with others on the same subject model, and progress or mastery is visible somewhere in the product.

Milestone 6 is accepted when the relevant tests pass, generic leftover messaging is removed, and metadata and navigation reflect a single coherent product.

## Idempotence and Recovery

The planned work is mostly additive or subtractive in safe UI files. Removing homepage sections is idempotent: once the deleted sections are gone, repeating the edit has no further effect. New shared types and static content files are also safe to refine incrementally.

The main recovery concern is topic modeling. If the first taxonomy feels wrong, correct the shared type definitions and the static content files before wiring them deeply into the server or persistence layers. That is why this plan deliberately keeps the initial content source static and local rather than introducing a database migration early.

If a milestone lands in a half-finished state, keep the product navigable. Hide unfinished routes behind temporary homepage buttons only when they are ready, or clearly mark them as coming soon. Avoid routing users into broken screens.

## Artifacts and Notes

The initial Classics topic set should remain intentionally small. A good first version is:

- Greek History
- Roman History
- Mythology
- Famous Figures
- Vocabulary

The initial subtopic set can include:

- Greek History: city-states, wars, democracy, philosophers
- Roman History: republic, emperors, expansion, daily life
- Mythology: gods, heroes, monsters, major stories
- Famous Figures: generals, kings, philosophers, poets
- Vocabulary: beginner nouns, common verbs, thematic word lists

The homepage should ultimately communicate one sentence close to this meaning:

    Learn the classical world, then prove what you know.

That sentence does not need to be used verbatim, but the site should communicate that exact idea.

## Interfaces and Dependencies

Use the existing Next.js App Router, Tailwind styling, and Colyseus room infrastructure. No new framework is required for the first implementation.

By the end of Milestone 2, the shared layer should expose stable types similar to the following shape, whether they live directly in `packages/shared/index.ts` or in a new nearby module that is re-exported from there:

    export type ClassicsTrackSlug =
      | "greek-history"
      | "roman-history"
      | "mythology"
      | "famous-figures"
      | "vocabulary";

    export interface ClassicsTrack {
      slug: ClassicsTrackSlug;
      title: string;
      description: string;
      subtopics: string[];
    }

    export interface LessonSummary {
      id: string;
      track: ClassicsTrackSlug;
      title: string;
      description: string;
      order: number;
    }

    export interface LessonCheckpoint {
      id: string;
      prompt: string;
      acceptedAnswers: string[];
    }

    export interface LessonContent {
      id: string;
      track: ClassicsTrackSlug;
      title: string;
      body: string[];
      checkpoints: LessonCheckpoint[];
    }

    export interface TrackProgress {
      track: ClassicsTrackSlug;
      completedLessonIds: string[];
      masteryScore: number;
    }

For Quiz Mode, keep using the existing room and game interfaces where possible. If the current `topics: string[]` shape in `packages/shared/index.ts` becomes too loose, narrow it to accept `ClassicsTrackSlug[]` or a related typed alias wherever practical without forcing a large, risky rewrite.

The initial content source should be static TypeScript modules inside the web app. The product does not yet need a CMS, database-backed curriculum system, or external content dependency.

Revision note: Created this ExecPlan on 2026-04-05 to capture the user’s requested Classics pivot, homepage cleanup, and phased implementation order before code changes begin.
Revision note: Updated on 2026-04-05 after implementing the homepage repositioning, shared Classics content definitions, Learn Mode MVP routes, and initial Learn Mode tests.
