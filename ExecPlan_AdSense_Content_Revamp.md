# Revamp Content Quality to Address AdSense “Low Value” Feedback

This ExecPlan is a living document. The sections Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date as work proceeds.

This plan follows PLANS.md in the repo root.

## Purpose / Big Picture

Raise AdSense approval confidence by replacing “thin” or templated content with clearly human‑authored, evidence‑based, and distinctive material, while keeping the gameplay experience intact. After this change, the homepage, blog, and policy pages should demonstrate unique value, visible expertise, and real editorial signals that AdSense reviewers can recognize as original publisher content.

## Progress

- [ ] (TBD) Create an Editorial Policy page that explains how questions and content are produced, reviewed, and updated.
- [ ] (TBD) Add Author bios and attribution across key blog posts and/or an Authors page with real profiles.
- [ ] (TBD) Rewrite/upgrade 5–8 priority blog posts to include sources/citations, unique analysis, and original visuals.
- [ ] (TBD) Add a flagship “How to host a trivia night” guide with downloadable resources (templates or checklist).
- [ ] (TBD) Enhance homepage with a compact but meaningful “How Quivio works” editorial block, real screenshots, and trust cues.
- [ ] (TBD) Add a Testimonials/Use‑cases section with concrete, specific examples.
- [ ] (TBD) Audit and noindex or remove low‑value or repetitive pages until improved.
- [ ] (TBD) Validate with lint/build and manual QA; check sitemap and metadata after updates.

## Surprises & Discoveries

- None yet.

## Decision Log

- None yet.

## Outcomes & Retrospective

- To be written after implementation/validation.

## Context and Orientation

- Web app in apps/web (Next.js App Router). Homepage: apps/web/src/app/page.tsx and components in apps/web/src/app/components/Homepage. Blog index: apps/web/src/app/blog/page.tsx. Blog posts: apps/web/src/app/blog/*/page.tsx. Policy pages: apps/web/src/app/privacy-policy/page.tsx, apps/web/src/app/terms-conditions/page.tsx, apps/web/src/app/community-guidelines/page.tsx. Sitemap: apps/web/src/app/sitemap.ts. Noindex currently set on /guides. AdSense script is scoped to blog layout. Metadata lives in apps/web/src/app/blog/meta.ts plus per-page exports.

## Plan of Work

1) Editorial policy and authorship
   - Add a new page /editorial-policy describing how trivia questions are generated, moderated, and updated. Include human review steps, safety filters, and update cadence.
   - Create an /authors page or add author bios to each key post. Use real names/roles if possible. Link from blog posts to author profiles.

2) Blog content overhaul (high priority)
   - Select 5–8 posts with high traffic or visible placement (featured and top categories). Rewrite them with:
     - Specific examples (not generic templates).
     - At least 3 citations to reputable sources (links).
     - Original visuals (screenshots, simple charts, or custom illustrations).
     - Clear headings and concise paragraphs; remove repetitive filler.
   - Update blog metadata entries for new descriptions and titles.

3) Flagship guide + resources
   - Add a new guide page (e.g., /guides/host-trivia-night) with a printable checklist or template (PDF or simple downloadable doc).
   - Add links to the guide from homepage and blog.

4) Homepage trust and substance
   - Add a compact “How Quivio creates questions” block and “Moderation & safety” block with real process details.
   - Include 1–2 real screenshots of gameplay with captions.
   - Keep the existing room UI; move editorial content below the room list to avoid clutter.

5) Testimonials / use cases
   - Add a short section with 3–5 concrete use cases (e.g., “AP World History warmup,” “remote team Friday trivia”) and outcomes.

6) Content audit
   - Review blog posts and static pages; noindex any low‑value or “coming soon” pages until improved.
   - Ensure sitemap only lists valid, high‑value routes.

7) Validation
   - Run `pnpm --dir apps/web run lint`.
   - Optional: `pnpm --dir apps/web run build`.
   - Manual QA: check layout, images, metadata, and new links.

## Concrete Steps

- Working directory: /Users/felixodenthal/Quivio.
- Add /editorial-policy at apps/web/src/app/editorial-policy/page.tsx with a clear policy and update cadence.
- Add /authors at apps/web/src/app/authors/page.tsx with real bios, or embed bios in priority blog posts.
- Rewrite 5–8 posts under apps/web/src/app/blog/*/page.tsx; update apps/web/src/app/blog/meta.ts accordingly.
- Add a new guide under apps/web/src/app/guides/host-trivia-night/page.tsx and include a downloadable checklist in apps/web/public.
- Update homepage components in apps/web/src/app/components/Homepage/index.tsx to include the new editorial content and screenshots.
- Add images to apps/web/public (e.g., gameplay-1.webp, gameplay-2.webp).
- Update sitemap in apps/web/src/app/sitemap.ts to include /editorial-policy, /authors, and the guide page.

## Validation and Acceptance

- Lint passes and the site builds.
- Homepage shows editorial blocks, screenshots, and use cases beneath the room list.
- Blog posts show author bios, citations, and original visuals.
- /editorial-policy and /authors are reachable, linked, and indexable.
- Sitemap lists new high‑value pages; no dead routes remain.
- AdSense script remains scoped to blog only; ads.txt is unchanged and live.

## Idempotence and Recovery

- All changes are additive; low‑value pages can be noindexed if unfinished. Images can be removed safely if unused. Re-running lint/build is safe.

## Artifacts and Notes

- Keep a log of which posts were upgraded for AdSense review notes.

## Interfaces and Dependencies

- Use existing Next.js App Router and Tailwind. Static assets served from apps/web/public. No new libraries required.
