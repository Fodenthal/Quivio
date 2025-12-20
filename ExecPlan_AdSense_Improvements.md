# Raise AdSense Approval Confidence for quivio.fun

This ExecPlan is a living document. The sections Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date as work proceeds.

This plan follows PLANS.md in the repo root.

## Purpose / Big Picture

Improve the likelihood of Google AdSense approval for quivio.fun by strengthening crawl signals (sitemap/robots, metadata), trust signals (policies, contact, about), and content quality on entry points (homepage, blog, policy pages). After completion, reviewers should see detectable ad code on rich content, complete policy language (including AdSense/cookies), clear contact/trust info, and crawlable metadata and sitemap coverage.

## Progress

- [x] (2025-03-05) Add structured metadata (Organization and WebSite JSON-LD) to the global layout head for better trust/crawl signals.
- [x] (2025-03-05) Add Open Graph/Twitter metadata to primary non-blog pages (homepage, about, contact, privacy, terms, community-guidelines).
- [ ] (TBD) Ensure sitemap uses live domain via NEXT_PUBLIC_SITE_URL and verify robots.txt alignment.
- [ ] (TBD) Validate ads.txt, ad slot rendering on blog pages, and absence of ads on game screens.
- [ ] (TBD) Optional: add a lightweight “Latest from the Blog” teaser on homepage to surface publisher content above the fold without clutter.

## Surprises & Discoveries

- None yet.

## Decision Log

- None yet.

## Outcomes & Retrospective

- To be written after implementation/validation.

## Context and Orientation

- Web app lives in apps/web (Next.js App Router). Global layout: apps/web/src/app/layout.tsx. Blog layout: apps/web/src/app/blog/layout.tsx. Blog articles: apps/web/src/app/blog/*/page.tsx. Homepage: apps/web/src/app/page.tsx uses components in apps/web/src/app/components/Homepage. Policies: apps/web/src/app/privacy-policy/page.tsx, terms-conditions/page.tsx, community-guidelines/page.tsx. Trust pages: apps/web/src/app/about/page.tsx, contact/page.tsx. Sitemap is generated from apps/web/src/app/sitemap.ts. robots.txt lives in apps/web/public/robots.txt. Ads.txt lives in apps/web/public/ads.txt. AdSense script is scoped to blog layout; blog ads use BlogAd component.

## Plan of Work

Describe the edits a novice should perform:

1) Structured data in global head: In apps/web/src/app/layout.tsx add JSON-LD scripts for Organization and WebSite (including sameAs links to any social profiles if available, and the site URL). This boosts trust and crawl clarity without touching the game UI.
2) Metadata on core pages: Add Metadata exports with title/description/openGraph/twitter for homepage (apps/web/src/app/page.tsx), about, contact, privacy-policy, terms-conditions, and community-guidelines to avoid generic titles/descriptions.
3) Sitemap/robots alignment: Ensure NEXT_PUBLIC_SITE_URL is set (e.g., https://quivio.fun) so apps/web/src/app/sitemap.ts emits correct absolute URLs. Confirm robots.txt points to /sitemap.xml (already does) and update if needed.
4) AdSense presence and scoping: Confirm ads.txt matches pub ID; ensure blog pages render ads with NEXT_PUBLIC_ADSENSE_SLOT_ID; verify no AdSense script on game UI. Add a note in blog layout or README snippet for slot env requirement.
5) Optional homepage blog teaser: Add a small “Latest from the blog” strip beneath Active Rooms or near FAQ linking to 2–3 articles, to strengthen publisher-content presence without heavy copy.

## Concrete Steps

- Working directory: /Users/felixodenthal/Quivio.
- Structured data: In apps/web/src/app/layout.tsx, add two <script type="application/ld+json"> blocks for Organization and WebSite using base URL https://quivio.fun (or from NEXT_PUBLIC_SITE_URL). Include name “Quivio”, url, logo (if available in /public), and sameAs (optional).
- Metadata: For each non-blog page (page.tsx, about, contact, privacy-policy, terms-conditions, community-guidelines) export Metadata with specific title/description and openGraph/twitter fields.
- Sitemap/robots: Set NEXT_PUBLIC_SITE_URL in env (no trailing slash). Verify apps/web/src/app/sitemap.ts uses it. No code change needed if already set, but confirm base URL renders correctly in dev (`pnpm --filter quivio dev` then visit http://localhost:3000/sitemap.xml).
- Ads validation: Visit http://localhost:3000/ads.txt to confirm contents; visit a blog page in dev and check network for pagead2.googlesyndication.com and that <ins class="adsbygoogle"> renders. Verify game/home pages do not load the AdSense script.
- Optional blog teaser: In apps/web/src/app/components/Homepage/index.tsx add a narrow block with links to 2–3 blog posts, using existing styling classes, positioned near the FAQ or below Active Rooms.

## Validation and Acceptance

- Run `pnpm --filter quivio lint` (and `pnpm --filter quivio build` if feasible) from apps/web; expect no ESLint/TS errors.
- http://localhost:3000/sitemap.xml lists absolute URLs with the correct domain. robots.txt references the same sitemap path.
- View page source on homepage/about/privacy/terms/contact: metadata present (titles/descriptions/OG/Twitter). Blog pages retain their per-article metadata.
- Check global layout head: Organization and WebSite JSON-LD present. Game/home routes still do not load AdSense script; blog routes do.
- Optional: homepage shows a small blog teaser without breaking layout spacing.

## Idempotence and Recovery

- JSON-LD and metadata additions are additive and safe to reapply. If lint/build fails, remove or correct the last edit. Env changes are revertible by unsetting NEXT_PUBLIC_SITE_URL.

## Artifacts and Notes

- Keep note for deployment: ensure NEXT_PUBLIC_SITE_URL and NEXT_PUBLIC_ADSENSE_SLOT_ID are set in production environment.

## Interfaces and Dependencies

- Uses Next.js Metadata API for per-page metadata. Uses JSON-LD schema.org for Organization and WebSite in layout head. No new external dependencies required.
