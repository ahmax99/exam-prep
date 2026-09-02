# Spec: Desktop Layout Density — Rail Gutter, Shared Widths, Drill Card, MasteryBar Zero State

> Status: Draft · 2026-09-02

## Problem / Context

At desktop widths (observed at 1440×900) the app wastes the majority of the
viewport and reads as a mobile layout stretched onto a desktop canvas rather
than a deliberate desktop design. `PageTemplate` centers its content column
against the full viewport instead of the space actually remaining beside the
`AppSidebar` rail, producing a large dead gutter between the rail and the
content. Stacked sections on the dashboard don't share a measure, so the page
has a ragged right edge. The drill view — the app's core, most-visited screen
— caps at `max-w-[40rem]` and top-aligns, leaving a large vertical and
horizontal void on a typical laptop screen. Separately, `MasteryBar` renders
both of its fill segments at `width: 0%` for a brand-new `0/N` topic, which
reads as a broken/empty element rather than "no progress yet" — the exact
state every new user starts in.

## Goals

- The content column is optically centered within the space beside the rail
  at desktop widths, not within the full viewport.
- Stacked sections on the dashboard (`(main)/page.tsx`) share one content
  measure so their edges align.
- The drill view uses the available desktop space deliberately (not just a
  wider empty margin) while keeping question/answer text at the existing
  65–75ch readable measure from `DESIGN.md` §3.
- `MasteryBar` has a visibly distinct empty-meter state at `0/N`, with
  sufficient fill/track contrast in both light and dark themes.
- None of the above regresses the existing mobile layout.

## Non-Goals

- Redesigning the sidebar/rail itself (`AppSidebar`, `Sidebar.tsx` organism),
  its content, or its collapse/expand behavior — only how page content relates
  to the space it leaves.
- Introducing a new global layout primitive/breakpoint system beyond what's
  needed to fix the four reported issues.
- Changing `DESIGN.md`'s 65–75ch body-measure rule — the drill fix must work
  within it, not around it.
- Addressing light-mode contrast issues tracked separately in #44, beyond the
  MasteryBar contrast check this issue's acceptance criteria already call for.
- Any change to `apps/nextjs/src/app/(public)/(main)/page.tsx`'s data
  fetching, `CertificationCard`, or `WeakestObjectivesPanel` internals beyond
  the width/measure change needed for criterion 2.

## Requirements

### Functional

- `PageTemplate`'s non-centered ("left"/default alignment) layout accounts for
  the sidebar rail's width so its `mx-auto` content column is centered in the
  remaining space, not the full viewport, on desktop breakpoints. Mobile
  (rail collapsed/hidden, bottom tab bar in use) is unaffected.
- On the dashboard (`(main)/page.tsx`), the "Certifications" grid section and
  the `WeakestObjectivesPanel` section resolve to the same content width at
  desktop breakpoints, so their left and right edges align when stacked.
- The drill run page (`(drill)/[cert]/drill/[runId]/page.tsx`) uses the
  desktop viewport deliberately — e.g. vertical centering of the card and/or a
  secondary content region (progress/objective context) alongside the
  question card — while the question/answer text itself keeps a 65–75ch cap
  per `DESIGN.md` §3. Two layout approaches should be sketched before picking
  one (see `principles.md` "design it twice").
- `MasteryBar` (`components/atoms/MasteryBar.tsx`) renders a visibly distinct
  empty-meter appearance when `mastered === 0 && shaky === 0` (e.g. the
  `0/N` case), instead of an unstyled flat `bg-muted` line indistinguishable
  from a rendering failure. The existing `role="img"` / `aria-label` semantics
  are preserved.

### Constraints

- Layout changes stay within `src/components/layout/`, the affected route
  files, and `src/components/atoms/MasteryBar.tsx` — no new feature module is
  needed for this purely presentational fix.
- `PageTemplate` (`src/components/layout/PageTemplate.tsx`) and `MasteryBar`
  are atoms/layout primitives per `.claude/rules/architecture.md`: no
  `'use client'`, no hooks, no browser APIs added to either unless the design
  genuinely requires reading a client-only value (e.g. sidebar open/collapsed
  state) — prefer a CSS-only solution (e.g. sizing PageTemplate's centering
  relative to the sidebar's own CSS custom property / width, as `Sidebar.tsx`
  and `spaces.css` already do for the bottom-tab-bar height) over adding
  client state.
- Must not alter `AppSidebar`, `Sidebar.tsx`, or `SidebarProvider` behavior —
  only how content in `<main>` relates to the rail's occupied width.
- Tailwind CSS 4 utility classes, sorted per `oxfmt`'s `sortTailwindcss`; no
  new CSS files unless an existing mechanism (e.g. `spaces.css`, used for the
  bottom-tab-bar height reservation) is the established pattern for this kind
  of cross-component sizing coordination.
- `MasteryBar`'s empty state must work in both light and dark themes (this
  repo's Tailwind theme tokens, `bg-success`/`bg-warning`/`bg-muted`).
- Mobile layout (viewport widths where the rail collapses to the bottom tab
  bar) must be visually unchanged — verify via `/design-review` or manual
  breakpoint check per the acceptance criteria.

## Affected Areas

- [x] `apps/nextjs` — `src/components/layout/PageTemplate.tsx`
- [x] `apps/nextjs` — `src/app/(public)/layout.tsx`
- [x] `apps/nextjs` — `src/app/(drill)/[cert]/drill/[runId]/page.tsx`
- [x] `apps/nextjs` — `src/components/atoms/MasteryBar.tsx`
- [x] `apps/nextjs` — `src/app/(public)/(main)/page.tsx`
- [ ] `apps/nextjs/prisma` (schema/migration) — not applicable, presentational only

## Acceptance Criteria

- [ ] At ≥1280px viewport width, page content rendered through `PageTemplate`
      is optically centered within the area beside the rail — no unexplained
      gutter of more than ~48px against the rail's right edge.
- [ ] On the dashboard (`(main)/page.tsx`) at ≥1280px, the certifications grid
      section and the "Weakest objectives" section resolve to the same
      content width (their left/right edges align when inspected).
- [ ] At 1440×900, the drill view (`[runId]/page.tsx` + `DrillCard`) does not
      leave the majority of the viewport empty (vertically or horizontally);
      the question/answer text itself still respects a 65–75ch measure.
- [ ] A topic rendered with `mastered=0, shaky=0, total=N` (N > 0) shows a
      `MasteryBar` that is visibly an empty meter (e.g. a hairline border or
      other distinguishable unfilled treatment) — not a blank/flat line — in
      both light and dark themes, and passes a basic fill/track contrast
      check.
- [ ] Mobile layouts (viewport widths using the bottom tab bar / collapsed
      rail) are visually unchanged from before this change.
- [ ] `bun run check-types` and `bun run check-format` pass; `react-doctor
--scope changed` reports no new errors (this is a React/UI-only diff).

## Open Questions / Risks

- **Drill-view layout approach is unresolved.** The issue's fix sketch offers
  two directions — a persistent progress/objective sidebar alongside the
  question card, or simple vertical centering of the existing card — without
  picking one. This spec intentionally leaves that choice to `/plan`
  ("design it twice" per `principles.md`), which should sketch both and pick
  based on implementation cost and how much the drill's core "one question at
  a time" simplicity would be diluted by added persistent chrome.
- **Rail-aware centering mechanism is unresolved.** Whether `PageTemplate`
  reads the sidebar's occupied width via a shared CSS custom property (mirror
  of `spaces.css`'s bottom-tab-bar-height pattern), a CSS `calc()` against
  known rail widths, or a different mechanism needs a plan-time decision —
  `PageTemplate` is currently a pure server-renderable atom (no client script)
  and ideally stays that way.
- **Dependency on #39, overlap with #44.** The issue states this depends on
  #39 and overlaps the drill surface with #44 (light-mode contrast). This spec
  assumes #39 is already merged into `main` (the worktree branches from
  current `main`); if not, `/plan` or `/implement` should surface that as a
  blocker rather than silently proceeding. Whichever of #46 / #44 lands
  second should re-verify the other against the drill surface, per the issue.
- **"~360px vs ~740px" / "~240px gutter" figures are from one observed
  viewport (1440×900) and not hard pixel targets** — the acceptance criteria
  above intentionally state qualitative/relative thresholds (~48px gutter
  tolerance, shared width, "not the majority of the viewport empty") rather
  than exact pixel reproductions, since desktop breakpoint behavior should
  hold across a range of widths, not just the one screenshot width in the
  issue.
