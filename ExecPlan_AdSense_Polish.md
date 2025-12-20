# Final AdSense Polish for quivio.fun

This ExecPlan is a living document. The sections Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date as work proceeds.

This plan follows PLANS.md in the repo root.

## Purpose / Big Picture

Add small, high-impact polish items to further raise AdSense approval confidence: surface publisher content on the homepage, add trust/visual signals, and ensure policy language about cookie controls is explicit. After this, reviewers should see richer homepage content tied to the blog, clearer user trust cues, and complete ad/cookie disclosures.

## Progress

- [x] (2025-03-05) Confirmed envs for production: NEXT_PUBLIC_SITE_URL=https://quivio.fun and NEXT_PUBLIC_ADSENSE_SLOT_ID=<set>.
- [ ] (TBD) Add “Latest from the Blog” teaser on homepage (2–3 links) without clutter.
- [ ] (TBD) Add a compact testimonials/“Who uses Quivio” strip (3 one-liners) on homepage for trust.
- [ ] (TBD) Add a hero image/screenshot (optimized webp) on homepage or blog to reduce “bare” look; include alt text.
- [ ] (TBD) Add a short cookie-control note/link in Privacy (Google Ads settings) and ensure date is current in production build.
- [ ] (TBD) Validate locally: elements render cleanly, no layout breaks; lint passes.

## Surprises & Discoveries

- None yet.

## Decision Log

- None yet.

## Outcomes & Retrospective

- To be written after implementation/validation.

## Context and Orientation

- Web app: apps/web (Next.js App Router). Homepage container: apps/web/src/app/components/Homepage/index.tsx. Footer links already include Blog. Blog index: apps/web/src/app/blog/page.tsx. Policies: apps/web/src/app/privacy-policy/page.tsx. Public assets: apps/web/public (place screenshots here). AdSense script is scoped to blog layout. Metadata and sitemap already exist; envs are set for production.

## Plan of Work

Describe the edits:
1) Homepage blog teaser: in apps/web/src/app/components/Homepage/index.tsx, add a small “Latest from the Blog” block (2–3 links) placed near the FAQ or below existing enrichment, reusing card styling to avoid clutter.
2) Testimonials strip: in the same file, add a compact row (3 blurbs) highlighting use cases/users, keeping it slim and aligned with existing max-w-7xl container.
3) Hero/screenshot: add one optimized webp (apps/web/public/) and render it on the homepage hero/enrichment area with alt text; keep sizes modest to avoid layout shift.
4) Privacy cookie controls: in apps/web/src/app/privacy-policy/page.tsx, add a sentence with a link to Google Ads settings for opting out of personalized ads and confirm “Last Updated” remains current.
5) Validation: run `pnpm --dir apps/web run lint`; visually check homepage layout for spacing/alignment; confirm no new eslint errors.

## Concrete Steps

- Working dir: /Users/felixodenthal/Quivio.
- Add/optimize one screenshot to apps/web/public (e.g., hero.webp).
- Update apps/web/src/app/components/Homepage/index.tsx to include:
  - “Latest from the Blog” block (links to 2–3 posts).
  - Testimonials strip (3 short quotes/use cases).
  - Optional hero image with alt text.
- Update apps/web/src/app/privacy-policy/page.tsx with cookie control note/link to Google Ads settings.
- Run `pnpm --dir apps/web run lint`.
- (Optional) Preview via `pnpm --dir apps/web dev` and visually confirm alignment.

## Validation and Acceptance

- Lint passes with no new warnings.
- Homepage displays blog teaser, testimonials, and hero image without breaking existing layout or margins; cards align with max-w-7xl container.
- Privacy page shows cookie control note/link; date is current.
- Blog pages remain unchanged and ads stay scoped to blog only.

## Idempotence and Recovery

- Changes are additive; rerunning steps is safe. If layout feels cluttered, remove/scale back the new blocks. Assets can be deleted from public if not used.

## Artifacts and Notes

- Note for deploy: ensure new asset (hero.webp) is included in build if added.

## Interfaces and Dependencies

- Uses existing Tailwind utility classes and Next.js static asset serving from /public. No new dependencies required.
