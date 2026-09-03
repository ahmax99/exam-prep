# Spec: Honor `prefers-reduced-motion` globally via the token layer

> Status: Draft · 2026-09-02

## Problem / Context

`PRODUCT.md` (Accessibility & Inclusion) and `DESIGN.md` §6 both commit to honoring `prefers-reduced-motion` for every animation, but nothing in the codebase does — `grep -rn "prefers-reduced-motion\|motion-safe\|motion-reduce" apps/nextjs/src/` returns zero matches (confirmed at spec time). Three unguarded motion declarations ship today: `html { scroll-behavior: smooth }` in `src/styles/tokens/scrollbars.css:1-3`, and two 0.2s keyframe animations (`accordion-down`/`accordion-up`) in `src/styles/tokens/animations.css:19-25`. `scroll-behavior: smooth` is the most consequential of the three — it's global, fires on every in-page navigation, and is a common vestibular trigger.

## Goals

- With `prefers-reduced-motion: reduce` set, in-page navigation does not smooth-scroll.
- With the same setting, the accordion animations complete instantly instead of over 200ms.
- The reduced-motion rule lives in the token layer (`src/styles/tokens/`), per `DESIGN.md`'s existing convention that global visual rules belong there, not in components.
- Any animation added anywhere in the app after this change is covered by default, without the author having to remember to add a reduced-motion guard themselves.

## Non-Goals

- Per-animation crossfade alternatives. The issue's own fix sketch calls a blanket `animation-duration: 0.01ms !important` rule "the pragmatic starting point given there are only three motion sites today," and explicitly defers a bespoke crossfade to whenever a future animation carries meaning rather than being purely decorative — neither of today's two keyframe animations (accordion open/close) carries meaning beyond decoration. This spec implements the blanket rule only.
- A lint rule or automated check preventing a future animation from reintroducing the gap. The issue calls this "worth pairing with" but does not make it a requirement; adding oxlint/CI enforcement is a separate, larger piece of work (a custom rule or a CSS-audit script) that this spec's acceptance criteria don't depend on. Left as a follow-up.
- Any change to `-webkit-font-smoothing`/`-moz-osx-font-smoothing` or the `::-webkit-scrollbar*` rules in `scrollbars.css` — these are static rendering hints, not animations, and are unaffected by `prefers-reduced-motion`.
- Any change to how Tailwind's own transition utilities (if any are used elsewhere via `transition-*` classes rather than `@keyframes`) behave — inspection at spec time found no other motion declarations in `apps/nextjs/src` beyond the three named above; if `/plan` finds more, extending the same blanket rule to cover them is in scope, but no new call sites were found to enumerate here.

## Requirements

### Functional

- A new `@media (prefers-reduced-motion: reduce)` block, scoped to the token layer, sets `html { scroll-behavior: auto }` and forces every animation/transition on the page to an effectively instant duration (`animation-duration`, `animation-iteration-count`, `transition-duration` — the issue's fix-sketch snippet is a reasonable direct implementation of this).
- The rule is added as a new file, `src/styles/tokens/motion.css`, imported from `src/styles/tokens/index.css` in the existing alphabetical `@import` list (between `fonts.css` and `scrollbars.css`) — a new file rather than appending to `animations.css` or `scrollbars.css`, since the rule is cross-cutting (it applies to `scroll-behavior` from one file and `animation`/`transition` broadly, not to either file's own narrow concern) and the issue's fix sketch itself frames "a new `motion.css`" as the alternative to picking one of the two existing files.
- The blanket selector (`*, *::before, *::after`) is intentionally broad, per the issue's own reasoning: three motion sites today does not justify a narrower, harder-to-maintain per-selector rule.

### Constraints

- The existing `html { scroll-behavior: smooth }` declaration in `scrollbars.css` is left unchanged — the override happens via the reduced-motion media query in the new file, which — because `index.css` imports `motion.css` before `scrollbars.css` — must still win once both are loaded. CSS specificity for `html { scroll-behavior }` is equal in both files (same selector, same layer or no layer), so the later-imported rule wins by source order; confirm at implementation time that `motion.css`'s import position (or `@layer` placement, if this app's Tailwind setup uses layers for the token files) makes the reduced-motion override actually win over `scrollbars.css`'s unconditional declaration, rather than assuming import order alone settles it.
- No component-level change — this is a token/CSS-only spec, per `DESIGN.md`'s convention that global visual rules belong in `src/styles/tokens/`.

## Affected Areas

- [x] `apps/nextjs` — new `src/styles/tokens/motion.css`, one new `@import` line in `src/styles/tokens/index.css`
- [ ] `apps/nextjs/prisma` (schema/migration) — not touched

## Acceptance Criteria

- [ ] With `prefers-reduced-motion: reduce` set (e.g. via Playwright's `page.emulateMedia({ reducedMotion: 'reduce' })` or a browser dev-tools override), an in-page navigation does not smooth-scroll — the page jumps rather than animates.
- [ ] With the same setting, triggering an accordion open/close (wherever `animate-accordion-down`/`animate-accordion-up` is used in the app) completes with no perceptible animation duration.
- [ ] Without `prefers-reduced-motion` set (the default), both behaviors are unchanged from today (smooth scroll still smooth-scrolls, accordion still animates over ~0.2s).
- [ ] The new rule lives in `src/styles/tokens/motion.css` and is wired into `src/styles/tokens/index.css`'s existing `@import` list — no reduced-motion CSS is added to a component file.
- [ ] `bun run check-types` and `bun run check-format` pass with no new errors.

## Open Questions / Risks

- Whether this app's Tailwind 4 setup applies any `@layer` ordering to the token `@import`s that would affect which of `motion.css`'s override vs. `scrollbars.css`'s base declaration wins, independent of plain import order — `/plan` should verify this concretely (e.g. by checking computed styles under the media query) rather than assume import order is sufficient, per the Constraints note above.
- Low risk otherwise: this is an additive, purely defensive CSS change with no existing behavior removed for users who don't set the OS-level preference.
