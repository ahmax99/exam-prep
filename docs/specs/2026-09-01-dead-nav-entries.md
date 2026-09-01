# Spec: Dead Navigation Entries

> Status: Draft · 2026-09-01

## Problem / Context

Primary navigation advertises more destinations than the app actually has. On mobile, `apps/nextjs/src/components/layout/BottomTabBar.tsx` renders four tabs (Study, Saved, Runs, Stats); `Runs` and `Stats` have `href: null` unconditionally and render as a muted `<span>` instead of a link, and `Saved` also falls back to the same inert `<span>` whenever there is no primary certification (`savedHref` resolves to `null`). So on a normal visit only 2 of 4 tabs work.

On desktop, the side panel's "Practice" group (currently `apps/nextjs/src/components/layout/AppSidebar.tsx`, populated by `apps/nextjs/src/app/(public)/layout.tsx`) has a "Past runs" entry that is always built with `href: null` and `count: null` — it renders as a disabled button with an em-dash badge and no explanation. Unlike the mobile tab, this entry does render as a real disabled `<button>` (via the shared `SidebarMenuButton`), which does pick up `aria-disabled`-equivalent (native `disabled`) styling — but the button carries no reason, and native `disabled` removes it from the tab order and typically isn't announced with any context by assistive tech, so it fails the same "looks like a destination, does nothing" problem from a different angle.

An inert nav entry is worse than an absent one: it looks tappable, invites interaction, and gives no feedback about why nothing happened. Real data exists behind at least the "Runs"/"Past runs" destination already: `getRunHistory` (`apps/nextjs/src/features/drill/server/api/index.ts`) and `RUN_HISTORY_LIMIT` (`apps/nextjs/src/features/drill/constants/index.ts`) exist and are already used to render a "Past runs" history table on the run-summary page (`apps/nextjs/src/app/(public)/[cert]/drill/[runId]/summary/page.tsx`). Note `getRunHistory` currently takes a scope (`scopeKind` + `scopeValue` + `certSlug`) matching one particular run's practice scope — it is not, as it stands, a query for "every run for this certification" or "every run across all certifications," which matters for deciding what a standalone Runs destination would actually list.

No backing data surface exists yet for a general "Stats" destination; the certification page already carries mastery/progress charts.

## Goals

- Every primary navigation entry (mobile tab bar, desktop side panel practice list) either navigates to a real, working destination or is not shown at all.
- The two surfaces (mobile tab bar, desktop side panel) agree on which destinations exist — no entry that's live on one and dead on the other.
- Any entry that must stay visible while unavailable communicates that state honestly to every user, including assistive-tech users.

## Non-Goals

- Building a general cross-certification "Stats" dashboard or any new stats data surface — the fix sketch treats dropping this destination as the likely honest outcome, but the final call is left open below.
- Redesigning the visual layout, icon set, or grouping of either the tab bar or the side panel beyond what's needed to remove or wire the affected entries.
- Any change to certification-scoped charts already on the certification page.
- Any change to authentication/authorization (this app has none) or to who can see which certification's data.

## Requirements

### Functional

- The "Runs" mobile tab and the "Past runs" desktop side-panel entry must resolve the same way: both link to a real run-history route, or both are absent. Never one wired and the other dead.
- The "Saved" mobile tab must not render as inert text when there is no primary certification — it must be hidden in that case (matching the "hide rather than stub" instruction in the issue), not shown disabled.
- The "Stats" mobile tab must either link to a real destination or be removed; it must not remain as unconditional dead text.
- If any navigation entry is intentionally kept visible in an unavailable state (rather than removed), it must expose real disabled semantics: `aria-disabled` (not a bare `<span>` and not a native `disabled` attribute that removes it from the tab order), plus a discoverable reason on hover/focus, and it must remain reachable and correctly announced by assistive technology.
- No entry may render with `href: null`/no destination and no explanatory affordance — the current em-dash-badge-with-no-tooltip pattern for "Past runs" does not satisfy this.

### Constraints

- Any new route (e.g., a run-history listing) is a Server Component under `apps/nextjs/src/app/(public)/`, following this repo's existing routing and layer conventions — real logic in a feature's `server/api`, thin page/route code.
- Reuse or extend existing data access (`getRunHistory`, `RUN_HISTORY_LIMIT`) rather than duplicating query logic, but account for its current scope-bound shape when deciding what a standalone listing shows (see Open Questions).
- No client-side data fetching for anything server-renderable; no `NEXT_PUBLIC_*` env vars introduced.
- Changes stay within `apps/nextjs/src/components/layout/BottomTabBar.tsx`, `apps/nextjs/src/app/(public)/layout.tsx`, `apps/nextjs/src/components/layout/AppSidebar.tsx`, and — only if the Runs/Past-runs decision is "build it" — a new route plus whatever `features/drill/server/api` additions that route needs.
- Follow this repo's atomic-design and feature-folder placement rules for any new component or query.

## Affected Areas

- [x] `apps/nextjs` — `src/components/layout/BottomTabBar.tsx` (mobile tab bar)
- [x] `apps/nextjs` — `src/app/(public)/layout.tsx` and `src/components/layout/AppSidebar.tsx` (desktop side-panel practice list)
- [x] `apps/nextjs` — `src/features/drill/server/api` (only if a new run-history listing query is needed)
- [ ] `apps/nextjs/prisma` (no schema change expected — `getRunHistory` already reads the existing `DrillRun`/`Attempt` models)

## Acceptance Criteria

- [ ] No navigation entry (mobile tab bar or desktop side panel) renders as inert text or a non-interactive dead end with no explanation.
- [ ] Every visible tab/side-panel entry either navigates to a real, working page or is absent from the UI entirely.
- [ ] The "Runs" mobile tab and the "Past runs" desktop entry are consistent: both present and linked, or both absent — never split.
- [ ] The "Saved" mobile tab is hidden (not rendered inert) when there is no primary certification.
- [ ] Any entry deliberately kept in a disabled state exposes `aria-disabled`, surfaces a reason on hover/focus, and is reachable and correctly announced by a screen reader (verified via keyboard navigation and accessible-name/role checks).
- [ ] `bun run check-types` and `bun run check-format` pass with no new violations.

## Open Questions / Risks

- **Runs / Past runs — build or drop?** `getRunHistory` exists but is scoped to one practice scope (`scopeKind`/`scopeValue`) at a time, not "all runs for a certification" or "all runs overall." Building a standalone Runs page means deciding what it lists (e.g., all runs for the visitor's primary certification, unscoped) and likely adding a new, less-scoped query alongside the existing one — this is real, if modest, new work, not just wiring an existing link. The alternative is dropping both the mobile "Runs" tab and the desktop "Past runs" entry until that surface exists. This decision should be made explicitly at `/plan` time, not defaulted silently.
- **Stats — drop, or is there a cheaper real destination?** The issue's own fix sketch treats dropping this tab as the likely honest answer since no backing data surface exists and the certification page already carries the charts. Confirm there's no already-existing lightweight destination (e.g., linking "Stats" to the primary certification's page) before defaulting to removal — the two options meaningfully differ (removing a nav entry vs. repointing it).
- **Desktop's existing `disabled` button for "Past runs" already isn't a bare `<span>`** — it renders as a real (native-`disabled`) button via `SidebarMenuButton`. If "Past runs" ends up dropped rather than built, this is moot; if it's kept in a disabled state for some interim reason, the native `disabled` attribute will need to become `aria-disabled` plus a real reason (e.g., a tooltip or `aria-describedby` explaining unavailability) to meet the acceptance criteria, since native `disabled` removes the element from the tab order.
- **No primary certification at all** (`certifications` array empty): the "Saved" tab already handles this by nulling its href; the same "hide rather than show inert" treatment should extend consistently to how the desktop side panel's practice group behaves in this state, though that's pre-existing behavior outside this issue's stated scope and only needs auditing for consistency, not necessarily a change.
