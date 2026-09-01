# Spec: Mobile floating Drill CTA and tab bar cover bottom page content

> Status: Draft · 2026-09-01

## Problem / Context

On mobile viewports, two independent `fixed`-positioned overlays stack at the bottom of the screen: the `BottomTabBar` (`fixed bottom-0 h-16`, `apps/nextjs/src/components/layout/BottomTabBar.tsx`) and a floating "Drill all N →" CTA (`fixed inset-x-4 bottom-20`, `min-h-11`) rendered on both the certification page (`apps/nextjs/src/app/(public)/[cert]/page.tsx`) and the bookmarks page (`apps/nextjs/src/features/bookmarks/client/components/DrillBookmarksButton.tsx`, used from `apps/nextjs/src/app/(public)/[cert]/bookmarks/page.tsx`).

Together the tab bar and CTA occupy roughly 124px measured from the viewport bottom (64px tab bar + up to 44px CTA + the 20px gap between them), but the page content wrapper only reserves `pb-16` (64px) of bottom padding on mobile (`lg:pb-0` removes it entirely on desktop, where the CTA becomes `lg:static`). The shortfall (~60px) is real, unscrollable content hidden behind the two overlays.

Confirmed at 390×844 on `/lpic-1`: the "Last 7 days" doughnut chart's heading and most of its body sit under the CTA and tab bar and cannot be scrolled clear. The same collision exists on `/[cert]/bookmarks`, which uses the identical `pb-16 lg:pb-0` wrapper and CTA button pattern.

## Goals

- Every mobile visitor to the certification page and the bookmarks page can read and reach the full content of the page, including the last section, without any of it being permanently hidden behind a fixed overlay.
- The three values that currently have to "add up" by coincidence (tab bar height, CTA position, content bottom padding) are expressed in a way that can't silently drift back out of sync as any one of them changes.

## Non-Goals

- Redesigning the tab bar itself (its four tabs, icons, or the "Saved"/"Runs"/"Stats" placeholder links).
- Changing the CTA's visual style, label, or destination — only its position/stacking behavior relative to scrolled content.
- Any change to desktop (`lg:` and up) layout or behavior — the CTA is already `lg:static` and the tab bar already `lg:hidden`; both should look and behave exactly as they do today at that breakpoint.
- Auditing every other page in the app for similar fixed-overlay collisions — scope is limited to the certification page and the bookmarks page named in the issue.

## Requirements

### Functional

- On the certification page (`/[cert]`) at mobile width, no part of the page's content (including the "Last 7 days" heading and doughnut chart) is obscured by the tab bar or the CTA at any scroll position, including scrolled fully to the bottom.
- On the bookmarks page (`/[cert]/bookmarks`) at mobile width, no part of the page's content is obscured by the tab bar or the CTA (`DrillBookmarksButton`) at any scroll position, including scrolled fully to the bottom.
- The tab bar's safe-area inset (`pb-[env(safe-area-inset-bottom)]`) continues to be honored after the fix.
- Desktop (`lg:` and up) rendering of both pages is visually unchanged.

### Constraints

- Whatever spacing/positioning values the fix introduces or changes must be expressed once (e.g. a shared constant, a single source of truth for the overlay heights) rather than as a second independent magic number that could drift out of sync with the tab bar or CTA again.
- Must not regress the `lg:static` / `lg:hidden` desktop behavior already in place for the CTA and tab bar respectively.
- Follow this repo's existing conventions for shared cross-feature UI/layout code (`.claude/rules/architecture.md`'s `src/components/layout/` and feature `client/components/` placement) — this is a UI-only fix; no `server/api`, schema, or database change is implied by the issue.

## Affected Areas

- [x] `apps/nextjs` — `(public)/[cert]/page.tsx`, `(public)/[cert]/bookmarks/page.tsx`, `components/layout/BottomTabBar.tsx`, `features/bookmarks/client/components/DrillBookmarksButton.tsx`
- [ ] `apps/nextjs/prisma` (schema/migration) — not applicable

## Acceptance Criteria

- [ ] At 390×844 on `/lpic-1`, the full "Last 7 days" section (heading and complete doughnut chart) is visible and unobstructed once scrolled to the bottom of the page.
- [ ] At 390×844 on `/lpic-1/bookmarks` (with at least one bookmark present so the CTA renders), no page content is hidden behind the tab bar or the CTA at the bottom of scroll.
- [ ] Desktop (`lg:` and up) layout of both pages is visually unchanged from current behavior.
- [ ] The tab bar's safe-area inset is still applied at the bottom of the tab bar on mobile.
- [ ] The fix does not reintroduce a second, independent magic-number padding value that isn't derived from (or kept in sync with) the tab bar/CTA dimensions.

## Open Questions / Risks

- **Which of the two fix approaches to take is not decided by this spec** — it's a real design fork the issue itself calls out, and `/plan` (with a human able to weigh in at the plan-approval gate) should resolve it rather than an agent defaulting silently:
  1. **Reserve the real height.** Increase the page content's bottom padding to actually clear both overlays plus their gap (roughly `pb-36` today, ideally derived from the tab bar height + CTA height + gap rather than a third hand-picked number). Smallest change; keeps the CTA persistently reachable while scrolling; keeps the current visual language of "two floating layers."
  2. **Stop stacking two fixed layers.** Move the CTA into normal document flow (it already renders `lg:static` right under the exam metadata on desktop) and let only the tab bar remain fixed. Removes the entire class of bug rather than padding around it, and gives the CTA a stable position instead of one that floats over content — but the CTA is no longer reachable without scrolling back up, which may or may not be acceptable depending on how often users want the drill action mid-scroll.
  - This decision should be made once, at the `/plan` stage, and applied identically to both the certification page's inline CTA and `DrillBookmarksButton`'s CTA — they should not end up using two different resolutions of the same problem.
- The tab bar's safe-area inset padding (`pb-[env(safe-area-inset-bottom)]`) adds a device-dependent, non-zero amount on some phones (notched/gesture-bar devices) on top of the 64px `h-16`; whichever fix is chosen should account for this if the reserved space is meant to be exact rather than generously oversized.
- No unit/E2E test runner exists in this repo (per `CLAUDE.md`); acceptance criteria here are verified via Playwright/manual viewport checks during `/implement`, not an automated regression test that would catch this class of bug recurring in future.
