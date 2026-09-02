# Spec: Real theme support — system-preference default with a light/dark/system toggle

> Status: Draft · 2026-09-02
> Backlog issue: **#44**

## Problem / Context

`apps/nextjs/src/styles/tokens/colors.css` defines a complete token set twice
— a `:root` light palette and a `.dark` palette, including semantic
(`--success`, `--warning`, `--destructive`) and chart tokens in both — but
`apps/nextjs/src/app/layout.tsx` hardcodes `className={cn('dark', ...)}` on
`<html>`. There is no theme provider, no toggle, and no
`prefers-color-scheme` handling, so every visitor gets dark mode regardless
of their OS setting and the entire light palette is unreachable dead weight.

This reverses a prior, deliberate decision: issue #11's spec
([`docs/specs/2026-08-29-11-dark-mode-root.md`](./2026-08-29-11-dark-mode-root.md))
hardcoded the `dark` class specifically _because_ the app was dark-only by
design (decision D12 in
[`docs/specs/2026-08-29-cert-drill-design.md`](./2026-08-29-cert-drill-design.md#d12--the-dark-class-gets-its-own-issue-resolved)),
and explicitly named "a theme toggle or light mode" and "a theme provider
library" as **non-goals** at the time. Issue #44 supersedes that decision —
see Open Questions below.

A study app used for long sessions, frequently in bright rooms, has a real
comfort/legibility cost from being forced dark, and `DESIGN.md` §1 already
claims "full light/dark parity out of the box" as a system characteristic —
a claim the running app currently contradicts.

## Goals

- On first visit, with no stored preference, the app renders in the theme
  the visitor's OS reports (`prefers-color-scheme`).
- A visible, accessible toggle lets a visitor choose light, dark, or system,
  and that choice persists across reloads and future sessions.
- No flash of the wrong theme on first paint, in either direction.
- Every screen that renders semantic or chart tokens is legible and passes
  contrast in light mode, not just the theme mechanism itself.

## Non-Goals

- Redesigning the light palette's actual color values — `colors.css`'s
  `:root` block already exists with full token parity (per issue #1's spec)
  and is not being re-authored here; this issue is about making it
  _reachable_ and verifying it renders correctly, not repicking colors.
- Per-route or per-component theme overrides — one theme applies to the
  whole app at a time.
- Any change to `DATABASE_URL`/env handling — theme choice is pure client
  UI state (`localStorage`, via `next-themes`), not a server-persisted user
  preference (this app has no auth/user concept per `architecture.md`).

## Requirements

### Functional

- The app's theme resolves in this order: an explicit stored choice (light
  or dark) if one exists, else the OS `prefers-color-scheme`, re-evaluated
  live if the OS setting changes while "system" is selected.
- A toggle control, reachable from every page via `PageHeader`, exposes
  three states — light, dark, system — as a single control (not three
  separate buttons), with the current state visually indicated.
- The toggle is keyboard-operable (reachable via Tab, actionable via
  Enter/Space) and carries an accessible name that a screen reader announces
  (e.g. "Theme: dark" or equivalent, updating as the state changes).
- Selecting a theme persists it (survives a full page reload and a new
  browser session on the same device).
- `<html>` receives its theme class server-side on first paint (no flash of
  the wrong theme, no visible flash of unstyled content).

### Constraints

- Use `next-themes` with `attribute="class"` and `defaultTheme="system"` —
  the standard pairing with shadcn/ui referenced in the issue's fix sketch —
  rather than a hand-rolled `localStorage` + `useEffect` mechanism; `<html>`
  already carries `suppressHydrationWarning`, which `next-themes` needs.
- The theme provider is a client component (it needs `useTheme`/context) and
  belongs under `src/features/*/providers/` or `src/components/`, per
  `architecture.md`'s split — not inlined into `layout.tsx` itself beyond
  wrapping `children`.
- The toggle is a new component; per `conventions.md` it needs a
  `data-slot` on its root and, if it's a variant-bearing atom, CVA. Given it
  composes a trigger + a 3-way choice, it likely belongs as a molecule
  (`src/components/molecules/`) or lives in `PageHeader`'s own directory if
  it has no reuse outside the header — follow the atomic-design rule in
  `architecture.md` for wherever it lands.
- No `NEXT_PUBLIC_*` env var — theme is pure client state, not a config
  value needing to cross the server/client boundary via env.
- No new dependency beyond `next-themes` itself; check `apps/nextjs/package.json`
  and run `bun run check-mismatches`/`sync-packages` (syncpack) if a version
  pin is needed, though with one workspace this is close to a no-op.
- Any visual bug found in the light-mode contrast pass belongs to this issue
  only if it's a token-usage bug in a component (e.g. a hardcoded dark-only
  color bypassing the token); a genuinely wrong token _value_ in
  `colors.css` is scope creep into issue #1's territory and should be
  flagged, not silently repainted, unless trivial.

## Affected Areas

- [x] `apps/nextjs` — `src/app/layout.tsx` (wrap with the provider, drop the
      hardcoded `dark` class), a new theme provider component, `PageHeader`
      (toggle placement), and a light-mode contrast pass over:
      `src/components/atoms/MasteryBar.tsx`, `src/components/molecules/DoughnutChart.tsx`,
      the drill answer-verdict states and explanation panel under
      `src/features/drill/client/components/`.
- [ ] `apps/nextjs/prisma` — not touched; no schema or data involved.

## Acceptance Criteria

- [ ] With no stored preference and the OS set to light, the app renders the
      light palette on first load (verified via Playwright with an emulated
      `prefers-color-scheme: light`); same for dark.
- [ ] A toggle in `PageHeader` is visible, reachable by keyboard, and has an
      accessible label reflecting its current state (verified via
      Playwright's accessibility tree, not just visual inspection).
- [ ] Selecting "light" persists across a full page reload; selecting
      "system" then changing the OS preference (emulated) updates the
      rendered theme without a manual reload.
- [ ] No flash-of-wrong-theme is observable — checked by loading with a
      stored "light" preference and confirming no dark-then-light repaint,
      and vice versa.
- [ ] In light mode: the drill card's correct/incorrect/no-match answer
      states, the explanation panel, both doughnut charts, and `MasteryBar`
      are all visibly legible and their body text meets the ≥4.5:1 contrast
      ratio `PRODUCT.md` commits to (spot-checked with a contrast tool
      against the actual rendered colors, not the raw hex pairs in
      `colors.css`).
- [ ] `DESIGN.md`'s light/dark parity claim is true of the running app (a
      light-mode pass through the app's real routes, not just the landing
      page).
- [ ] `bun run check-types`, `bun run check-format`, and
      `bunx react-doctor@latest --verbose --scope changed` all pass.

## Open Questions / Risks

- **This reverses a documented design decision (D12 / issue #11), which
  explicitly named a theme toggle and `next-themes` as non-goals "per
  D1[2], this app ships dark-only."** The issue body for #44 treats that
  as settled in favor of adding real theme support; a human should confirm
  at spec-approval time that this supersession is intended, not an
  agent misreading of scope, since it's the opposite of a decision another
  spec made deliberately and recently (2026-08-29).
- **Toggle placement/visual design is unspecified beyond "in `PageHeader`."**
  The issue's fix sketch says "an icon button with an accessible label" but
  doesn't specify the exact icon set, three-state interaction pattern (a
  single cycling icon button vs. a dropdown/segmented control), or where in
  the header's existing `Logo` / `SidebarTrigger` layout it sits on mobile
  vs. desktop widths. Left to `/plan` and `app-design` skill guidance
  (shadcn's own theme-toggle patterns) rather than pinned here, since this
  is a _how_ decision, not a _what_.
- **Scope of the "light-mode contrast pass."** The issue names four specific
  surfaces (drill card verdict states, explanation panel, doughnut charts,
  `MasteryBar`) as the ones "never rendered" — this spec treats that list as
  the acceptance boundary rather than an exhaustive light-mode QA of every
  screen, since a full-app pass is unbounded and better suited to a
  follow-up `/design-review` after this ships.
- **No existing theme-toggle component or pattern to match** — this is a
  net-new UI element in an otherwise fairly minimal `PageHeader`; the
  `shadcn` skill's own theme-toggle recipe is the natural reference during
  `/plan` rather than inventing one from scratch.
