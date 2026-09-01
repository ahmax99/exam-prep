# Spec: Accurate Drill Run Sizing and a Recommended Start on `/[cert]`

> Status: Draft · 2026-09-01

## Problem / Context

`/impeccable critique` (2026-08-31, 18/40) flagged two compounding problems on `/[cert]`:

1. **The primary button lies about size.** `app/(public)/[cert]/page.tsx:174` renders `Drill all {selectedExam.questionCount} →` → e.g. "Drill all 198 →". `DEFAULT_RUN_LIMIT = 20` (`features/drill/constants/index.ts`) and `startRunSchema` caps `limit` at `MAX_RUN_LIMIT = 100` — a run can never actually contain 198 questions. Every click starts a 20-question run regardless of the number printed on the button. `DrillBookmarksButton` has the identical bug (`Drill all {count} →`), currently masked only because bookmark counts are small.
2. **Too many undifferentiated entry points.** `/[cert]` presents 9+ ways to start a drill at one decision point (the mis-sized "Drill all" button, a per-exam "Drill →" for each exam, one row per topic, plus the sidebar's Missed/Never seen/Bookmarked) with no default and no recommendation — well past the ≤4-item working-memory guideline for a single decision, even though the app already has the mastery data (`missed`/`unseen` counts, already surfaced in the sidebar via `getDashboard`) needed to suggest a specific next action instead of making the user choose blind.

## Goals

- Every "Drill …" control states a question count that matches the run it will actually start (never a count the run can't reach).
- The size of a run is either stated accurately or explicitly chosen by the user before the run starts.
- `/[cert]` presents exactly one visually primary, recommended drill action; the exam/topic/scope entry points remain available but read as clearly secondary.
- `DrillBookmarksButton` states an accurate count under the same rule as the certification page's button.

## Non-Goals

- Raising `MAX_RUN_LIMIT` above 100, or otherwise changing how large a single run is allowed to be — a separate product decision about session length.
- Changing the mastery/scheduling algorithm itself (how "missed" or "unseen" are computed) — this spec only uses the counts that already exist.
- Rewriting the per-exam or per-topic list rows beyond visually demoting them relative to the new primary action.
- Copy voice/tone polish beyond what's needed to state counts accurately — tracked separately per #39, which this issue depends on for voice.

## Requirements

### Functional

- The certification-page primary action and `DrillBookmarksButton` must never print a question count larger than the count the resulting run will actually contain.
- The drill launcher route (`app/(public)/[cert]/drill/page.tsx`) must honor an explicit run size passed through the URL, since `startRunSchema` already accepts an optional `limit` and the launcher currently ignores it.
- The user must be able to choose a run size (e.g. a small default, a larger one, or the full remaining scope) before a run starts, rather than always getting the same fixed default.
- `/[cert]` must compute and present one recommended drill action ahead of the exam/topic list — using the certification's existing missed-first-then-unseen mastery signal to decide what that recommendation targets — without requiring the user to pick a scope manually.
- The recommended action and the existing exam/topic/scope entry points must remain visually distinguishable: one primary, the rest secondary.

### Constraints

- Any new run-size selection UI is a client interaction (`'use client'`) only where it must be; the certification page itself stays a Server Component per `.claude/rules/architecture.md`.
- No new Prisma model or schema — the mastery/missed/unseen data this spec's recommendation relies on is already read via `features/progress/server/api` (`getDashboard`) and `features/catalog/server/api`.
- Any new query-param shape added to the drill launcher must be validated by a Zod schema in `features/drill/schemas/`, consistent with `startRunSchema`'s existing `limit` bound (`MAX_RUN_LIMIT`).
- Follow existing atomic-design/feature-folder placement: certification-page-specific UI stays in `features/drill/client/components/` or `features/catalog/server/components/`, not `src/components/`.

## Affected Areas

- [x] `apps/nextjs` (`app/(public)/[cert]/page.tsx`, `app/(public)/[cert]/drill/page.tsx`, `features/drill/schemas/drillLauncherParams.schema.ts`, `features/bookmarks/client/components/DrillBookmarksButton.tsx`, `features/catalog/server/components/ExamList.tsx`)
- [ ] `apps/nextjs/prisma` (schema/migration)

## Acceptance Criteria

- [ ] No control on `/[cert]` (primary action, per-exam "Drill →", `DrillBookmarksButton`) ever displays a question count greater than the number of questions the resulting run will contain.
- [ ] The drill launcher (`/[cert]/drill?...`) accepts a run-size parameter and passes it through to `startRun`'s `limit`, respecting `MAX_RUN_LIMIT`; omitting it falls back to today's `DEFAULT_RUN_LIMIT` behavior.
- [ ] From `/[cert]`, a user can start a run at more than one size (at minimum: the default size, and "all remaining questions in scope" capped at `MAX_RUN_LIMIT`) without leaving the page before the run starts.
- [ ] `/[cert]` renders exactly one element that is the visually primary drill action, and it is clearly recommended (not just first in DOM order) — e.g. `Missed` first when `missed > 0`, else `Never seen` when `unseen > 0`, else the current "Drill all" behavior, sized accurately per the first criterion.
- [ ] The exam list and topic rows remain present and reachable, but are visually secondary relative to the recommended action (not competing for primary visual weight).
- [ ] `DrillBookmarksButton` displays an accurate count once bookmark counts exceed `DEFAULT_RUN_LIMIT`, using the same sizing fix as the certification page's button.
- [ ] `bun run check-types` and `bun run check-format` pass with no new violations.

## Open Questions / Risks

- Exact recommendation copy ("Drill 20 · weakest first" vs. shorter alternatives) is a copy-voice decision that depends on #39 landing first; this spec fixes the _mechanism_ (accurate sizing + one recommended action) and leaves final wording to be reconciled with #39's voice guide at implementation time.
- The specific run-size choices to expose (e.g. 20 / 50 / all) beyond "default" and "all remaining, capped at `MAX_RUN_LIMIT`" is an implementation-time UX call, not fixed here, since the issue's fix sketch treats the exact segmented-control values as illustrative rather than mandated.
