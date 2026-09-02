# Spec: Landing Page First-Visit / Zero-Data State

> Status: Draft · 2026-09-02

## Problem / Context

The landing page (`/`) is the app's front door, and a first-time visitor with
a clean database gets no orientation and no path forward. The page's `<h1>`
exists but is visually hidden (`sr-only`), there is no unmistakable primary
action, "Weakest objectives" renders five identical `0%` rows instead of a
real empty state, and the certification card leads with a `0%` hero number —
a pattern `DESIGN.md` §6 explicitly rejects ("hero-metric blocks"). The result
is that the emptiest state of the app is also its least guided one, for the
one visit (first launch, before any drill attempt) every future session of
this personal tool depends on going well.

## Goals

- A first-time visitor immediately understands what the app is and has one
  unmistakable action to take (start a drill).
- The zero-attempts state is designed on purpose, not left to the populated
  layout rendering with zeros.
- The populated (post-attempt) view is unchanged in behavior.

## Non-Goals

- Redesigning the certification card or weakest-objectives panel for the
  populated (non-empty) case beyond what's needed to stop leading with a bare
  `0%`.
- Choosing a product name or wordmark — `PRODUCT.md`'s "Brand Commitments"
  confirms none is chosen yet; this spec's copy must stay name-agnostic.
- Any change to `MasteryBar`'s own zero-state — tracked separately per the
  issue body ("Related but filed separately... the layout/typography issue").
- Multi-certification handling beyond what already exists — today's data has
  exactly one seeded certification (LPIC-1), and this fix targets the
  single-certification first-visit case that screenshot in the issue shows.

## Requirements

### Functional

- The page renders exactly one visible (non-`sr-only`) `<h1>` stating what
  the app is, plus a one-line statement of purpose, above the fold.
- The page exposes one unmistakable primary call-to-action above the fold
  that starts a drill on the seeded certification (reusing the existing
  `/{cert}/drill?scopeKind=…` route now that scope links work, per #37/#38).
- When the visitor has zero attempts recorded, "Weakest objectives" renders
  an empty state — a short explanation of what will appear there and how to
  make it appear, with one next action — instead of ranked rows that are all
  `0%`.
- The zero-attempts determination must be a real "has this person attempted
  anything" check, not "the weakest-objectives query returned zero rows."
  `getWeakestObjectives`'s current SQL (`getWeakestObjectives.ts`) always
  returns `WEAKEST_OBJECTIVES_LIMIT` objective rows for any certification
  that has questions, via a `LEFT JOIN` on `QuestionProgress` grouped by
  objective — with zero attempts, `mastered` is `0` for every group, so the
  query returns real objective rows all sitting at `0%`, not an empty array.
  `WeakestObjectivesPanel`'s existing `objectives.length === 0` branch is
  therefore currently unreachable for a certification with any questions
  seeded — it never fires on a genuinely fresh database. Fixing the panel's
  branch condition alone does not fix the bug; the zero-attempts signal has
  to come from data that actually distinguishes "no attempts yet" from "every
  objective happens to be weak" (e.g. total mastered+shaky+missed across the
  certification, or an existence check against `QuestionProgress`/`Attempt`).
- With attempts present, "Weakest objectives" renders the ranked list exactly
  as it does today (no regression to the populated path).
- The certification card no longer leads with a bare `0%` as its largest
  element on first visit; before any practice, a count-based statement (e.g.
  "N questions, none seen yet") is more informative and matches the issue's
  fix sketch. The card's already-existing "no questions imported" branch
  (`mastery === null || total === 0`, for an unseeded certification) is a
  separate case from "certification is seeded but this visitor has zero
  attempts" (`mastery.total > 0`, `mastered === 0`, `masteryPercent === 0`)
  — both are zero-data states but need distinct copy, since one is a seed
  problem and the other is a normal first visit.

### Constraints

- Server-only data access stays in `server/api` (`getCertifications`,
  `getDashboard`, `getWeakestObjectives`); `HomePage` (a Server Component)
  and the two `server/components/` panels stay server components — no
  `'use client'`, no hooks, no browser APIs added to any of them.
- Any new empty-state UI should use the `Empty` component DESIGN.md §5/§6
  calls for ("the `Empty` component with one clear next action"; "ship
  loading (Skeleton), empty (Empty), error, and disabled states with every
  surface") — today's `src/components/atoms/index.ts` and
  `src/components/molecules/index.ts` export no `Empty` component yet, so
  introducing one (as an atom or molecule, per `architecture.md`'s
  atomic-design layering) is in scope if the plan phase decides that's the
  right shape, rather than hand-rolling another bespoke empty-state `div`
  alongside the ones that already exist in `CertificationCard` and
  `WeakestObjectivesPanel`.
- Follow `DESIGN.md`'s Monochrome Rule and Token Door Rule for any new
  markup — semantic classes only (`bg-card`, `text-muted-foreground`,
  `border-border`), no raw hex or Tailwind palette colors, no hero-metric
  blocks, no decorative stat tiles.
- Copy must stay name-agnostic per `PRODUCT.md`'s Brand Commitments (no
  product name has been chosen) and should read as written for someone
  actually about to sit the real LPIC-1 exam (`PRODUCT.md` Product Principle
  3), not generic SaaS-onboarding language.
- No schema or migration changes — this is presentation- and query-logic
  only, against the existing `Question` / `QuestionProgress` / `Exam` /
  `Certification` tables.
- Any new/changed Prisma query goes in the owning feature's `server/api`
  (`getWeakestObjectives.ts`, or a new helper alongside it in
  `features/progress/server/api/`), not inlined into the page or a
  component.
- Route handlers are untouched — this is a Server Component page, not an
  API route, so the neverthrow `catchAsyncError`/`AppError` pipeline applies
  only where `page.tsx` already uses it (`getCertifications`, `getDashboard`,
  `getWeakestObjectives` calls); don't introduce raw `try/catch`.

## Affected Areas

- [x] `apps/nextjs` (`(public)/(main)/page.tsx`,
      `features/progress/server/components/CertificationCard.tsx`,
      `features/progress/server/components/WeakestObjectivesPanel.tsx`,
      `features/progress/server/api/getWeakestObjectives.ts` — likely needs a
      zero-attempts signal beyond what it returns today,
      `src/components/atoms/` or `src/components/molecules/` — if an `Empty`
      component is introduced per DESIGN.md)
- [ ] `apps/nextjs/prisma` (no schema/migration change expected)

## Acceptance Criteria

- [ ] `/` renders exactly one `<h1>` that is visible (not `sr-only`), with a
      one-line statement of purpose, above the fold.
- [ ] `/` exposes one unmistakable primary call-to-action above the fold that
      links to a drill on the seeded certification.
- [ ] With zero attempts recorded (fresh database, or a certification with
      questions but no `QuestionProgress` rows), "Weakest objectives" renders
      an empty state with one next action — not rows of `0%`.
- [ ] With attempts present, "Weakest objectives" renders the ranked list as
      it does today — no regression.
- [ ] With zero attempts recorded, the certification card does not lead with
      a bare `0%` as its largest/first element.
- [ ] No chromatic color, raw hex, or Tailwind palette class is introduced
      outside the existing semantic token classes (`bg-*`, `text-*`,
      `border-*` design tokens).
- [ ] `bun run check-types` and `bun run check-format` pass.

## Open Questions / Risks

- **Root-cause fix location for "Weakest objectives."** The issue's own
  "Scope" section lists only `page.tsx`, `WeakestObjectivesPanel.tsx`, and
  `CertificationCard.tsx` — but as analyzed above, the actual defect is one
  layer deeper, in `getWeakestObjectives.ts`'s SQL, which cannot currently
  distinguish "no attempts anywhere" from "every objective is weak." The
  `/plan` phase should decide the exact mechanism (a second lightweight
  existence query, reusing the already-fetched `getDashboard()` totals since
  `HomePage` already calls both, or adding an aggregate to the existing
  query) — flagging this now since it changes the affected-files list from
  what the issue states.
- **Whether to introduce a shared `Empty` component now.** DESIGN.md
  prescribes one, but it doesn't exist yet, and two bespoke empty-state
  `div`s already exist in this codebase's affected files
  (`CertificationCard`, `WeakestObjectivesPanel`). Building a reusable
  `Empty` atom/molecule and migrating both is more thorough (and consistent
  with the design system this repo has committed to); patching only the
  currently-broken "Weakest objectives" case is smaller and stays inside the
  issue's literal scope. Recommend the former given `DESIGN.md` §5/§6 are
  explicit about this, but leaving the call to `/plan`.
- **Multi-certification future.** `PRODUCT.md` notes the schema is
  multi-certification-ready even though only one certification is seeded
  today. The primary-CTA design should target "the seeded certification(s)"
  generally (as `HomePage` already does by mapping over `certifications`)
  rather than hard-coding a single-certification assumption, even though
  only one exists to test against right now.
- **Above-the-fold is unverified against an actual viewport.** "Above the
  fold" acceptance criteria should be confirmed visually (e.g. via
  `/design-review`'s Playwright-driven check) during implementation, since
  this spec can't assert exact pixel placement.
