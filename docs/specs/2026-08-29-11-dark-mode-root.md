# Spec: Apply the dark theme to the app root

> Status: Superseded 2026-09-02 by
> [theme-toggle-system-preference](./2026-09-02-theme-toggle-system-preference.md)
> (issue #44), which reverses the dark-only commitment this spec made.
> Draft · 2026-08-29
> Design of record: [docs/specs/2026-08-29-cert-drill-design.md](./2026-08-29-cert-drill-design.md)
> Backlog issue: **#11** (no dependencies)

## Problem / Context

The app is dark-only by design ([D1](./2026-08-29-cert-drill-design.md#decisions)),
and `apps/nextjs/src/styles/tokens/colors.css` ships a complete `.dark` block.
But `apps/nextjs/src/app/layout.tsx` renders `<html data-scroll-behavior="smooth"
lang="en" suppressHydrationWarning>` — no `dark` class, no theme provider. The
`.dark` block is therefore inert: every token in it, old and new, resolves to
nothing today. Issues #5 and #7–#9 all render screens that assume the dark
palette is live. This was deliberately kept out of issue #1's single-file scope
(see that spec's Open Questions) and needed its own owner. This is that owner.

## Goals

- The dark palette renders on every page, with no flash of an unstyled or
  light-toned root on load.

## Non-Goals

- **A theme toggle or light mode.** Per D1, this app ships dark-only; there is
  no preference to persist and no toggle to build.
- **A theme provider library.** A static class on `<html>` is sufficient for a
  single, permanent theme — introducing `next-themes` or similar would add a
  runtime dependency for a decision that never changes.
- **Any token value change.** `colors.css` is not touched here; issue #1 owns it.

## Requirements

### Functional

- `<html>` in `apps/nextjs/src/app/layout.tsx` carries the `dark` class
  unconditionally, so every existing and new `.dark` token resolves on first
  paint, server-rendered — no client-side class toggle, no hydration mismatch.

### Constraints

- **Only `apps/nextjs/src/app/layout.tsx` changes.** No component, no token
  file, no config. `backlog-runner`'s anomaly gate G2 #3 blocks a diff that
  strays outside the plan's named files.
- The existing `data-scroll-behavior="smooth"`, `lang="en"`, and
  `suppressHydrationWarning` attributes are preserved unchanged.
- **No unnecessary comments.** Per `.claude/rules/principles.md`, comments
  explain _why_, never _what_ — the code already says what it does. Do not add
  section banners or a comment restating that the `dark` class enables dark
  mode. A comment earns its place only for a non-obvious invariant, and stays
  to one line.

## Affected Areas

- [x] `apps/nextjs/src/app/layout.tsx` — the only file this issue touches.
- [ ] `infra/**` — must not be touched (G2 #2 blocks unconditionally).

## Acceptance Criteria

- [ ] `git diff --stat` for the branch lists exactly one file:
      `apps/nextjs/src/app/layout.tsx`.
- [ ] The rendered `<html>` element's `class` attribute contains `dark` on
      every route, verified via Playwright on both `/` and at least one other
      route once one exists (this repo currently has only `/`).
- [ ] `getComputedStyle(document.body).backgroundColor` on `/` matches the
      `.dark` block's `--background` value, not `:root`'s.
- [ ] No hydration warning appears in the browser console on initial load.
- [ ] `bun run check-types`, `bun run check-format`, and
      `bunx react-doctor@latest --verbose --scope changed` all pass.

## Open Questions / Risks

- None. This is a one-line, zero-ambiguity change; it is its own issue only
  because it is a correctness dependency of #5 and #7–#9, not because it
  carries any design risk.
