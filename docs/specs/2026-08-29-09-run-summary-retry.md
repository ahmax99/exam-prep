# Spec: Run summary, retry same set, run history

> Status: Draft · 2026-08-29
> Design of record: [docs/specs/2026-08-29-cert-drill-design.md](./2026-08-29-cert-drill-design.md)
> Backlog issue: **#9** · Depends on: **#6** (drill engine), **#7** (drill UI), **#11** (dark mode root) · Touches: `features/drill/**`, `app/(public)/[cert]/drill/[runId]/summary/**`
> Visual reference: screen **07** of the mockup —
> <https://claude.ai/code/artifact/847f0428-275e-4248-b543-1879f3268357>

## Problem / Context

After issues #6–#8 a drill run can be started, answered and finished — and then
it goes nowhere. Answering the last question navigates to
`/[cert]/drill/[runId]/summary`, a route that does not exist.

The summary is where this app pays off its central promise: "keep every answer
ever given, so improvement over repeated runs is visible". The `Attempt` log is
immutable and `DrillRun.questionIds` is frozen precisely so that a run can be
replayed identically and the two scores compared. Decision **D7** is the reason:
a reshuffled retry cannot tell you whether you improved — a better score might
just be an easier draw. "Retry same set" therefore means the **same questions in
the same order**, and getting a fresh set is a separate, differently-named
action.

## Goals

- See the score for the run just finished, immediately on finishing it.
- See every previous run of the same scope, with each run's score, percentage
  and the delta against the run before it — so progress over repeats is a
  number, not a feeling.
- Replay the identical question set with one keystroke, to measure improvement.
- Start a fresh run built from the questions just missed, as a distinct action
  that is never confused with the replay.
- Review the misses with their explanations without leaving the page.

## Non-Goals

- **Reshuffling on retry.** Explicitly rejected by D7. "Retry same set" replays
  `DrillRun.questionIds` exactly; if a plan or implementation shuffles, sorts,
  filters or de-duplicates that array, it is wrong.
- **Deleting or pruning run history.** All runs are kept, per the user's
  requirement to "save all previous drill attempts". There is no delete action,
  no retention window, and no archiving.
- **Charts.** The summary is figures and a table. Doughnuts belong to the
  certification page (issue #5).
- **Cross-scope comparison.** History compares runs of the _same_ scope only. A
  cert-wide run and an objective run are not comparable and are never listed
  together.
- **Timed / mock-exam scoring.** Out of scope for the whole product (design doc
  Non-Goals).
- **Bookmark persistence** (issue #10) and **light mode**.

## Requirements

### Functional

**Route**

- `/[cert]/drill/[runId]/summary` is a Server Component page. It reads the run
  and its history through the drill feature's `server/api`; the browser never
  queries Prisma.
- Reaching the summary of a run that is not yet finished closes it first
  (`finishRun`), so `DrillRun.finishedAt` is set exactly once and the run stops
  appearing as in-progress.
- An unknown `runId`, or a run whose scope does not belong to `[cert]`, renders
  Next.js `notFound()` — not an empty page and not a 500.

**This run's score**

- The headline is the run's score as `correct / total` plus the percentage, in
  Geist Mono.
- Underneath, the outcome breakdown: **correct**, **self-graded**, **missed**,
  and **skipped** counts. Self-graded is broken out separately because
  `Attempt.selfGraded` records it and D3's whole point is that the two are not
  the same fact.
- Correctness for the headline counts a self-graded "I had it" as correct, per
  the design doc's mastery table.
- A run in which every question was skipped renders `0 / 0` with a 0%
  percentage and an explanatory line — not a division-by-zero `NaN`.

**Run history**

- A table listing **every** previous run of the same `(scopeKind, scopeValue)`,
  newest first, including the current run (marked as such).
- Columns: when the run started, score (`correct / total`), percentage, and the
  **delta** in percentage points versus the run immediately before it in that
  list.
- The delta is signed and rendered with its direction stated in text as well as
  colour (`+12 pts`, `−5 pts`, `even`) — colour alone must not carry it. An
  improvement uses the success token, a regression the destructive token, a tie
  the muted token.
- The oldest run has no predecessor and shows an em dash, not `+0`.
- The table scrolls inside its own horizontally-scrollable container; the page
  body never scrolls horizontally.
- With only one run in history the table renders that single row rather than an
  empty state — the first run is still a row.

**Actions**

- **"Retry same set"** — starts a new `DrillRun` whose `questionIds` is a
  **verbatim copy** of the finished run's `questionIds`: same members, same
  order, same length. Navigates to the new run's drill page.
- **"Drill weak spots"** — a **separate** action that starts a new run built
  from the questions just missed in this run. It is never the same button, never
  a variant of the retry button, and its label never contains the word "retry".
- **"Review N misses"** — expands, in place, the list of questions missed in
  this run, each with its prompt, the user's response, the correct answer and
  the stored explanation, rendered through issue #7's inline-code renderer. `N`
  is the actual miss count; the action is absent when the run has no misses.
- **"Back to \<cert\>"** returns to `/[cert]`.

**Keyboard**

| Key | Action           |
| --- | ---------------- |
| `R` | Retry same set   |
| `W` | Drill weak spots |

- Case-insensitive; ignored while focus is in a text input or a modifier is
  held. `W` is inert when the run has no misses.
- Each binding is shown as a visible hint on its button at `md` and above.

**Responsive**

- Below `md`: the score block stacks, the history table scrolls horizontally
  within its own container, keyboard hints are hidden, and the two primary
  actions (Retry / Weak spots) pin to the thumb zone at a minimum 44px height.
- At `md` and above: hints visible, actions inline beneath the score block.

### Constraints

- Server logic in `features/drill/server/api/`, starting with
  `const db = await getPrismaClient()`; no model layer, no Prisma call from a
  client component. `server/api` returns `ResultAsync` via `catchAsyncError`.
- The summary page fetches through `server/api` directly (Server Component); the
  two run-starting actions go through the existing
  `POST /api/drill/runs` handler from issue #6 via a same-origin relative path.
  This issue adds no new route handler.
- Any input this issue validates (the retry/weak-spots request body) is
  validated with Zod at the boundary, using the drill feature's existing
  `startRun.schema.ts`; no validation inside `server/api` logic.
- History queries use the existing `@@index([scopeKind, scopeValue, startedAt])`
  and select only the columns the table renders — no `include`-everything read
  of every `Attempt` in every historical run.
- Cache Components is off: no `'use cache'`, `cacheLife` or `cacheTag`. If the
  summary read is cached at all, use `unstable_cache` with tags, or simply a
  route segment config — the page is per-run and inherently dynamic, so
  `dynamic = 'force-dynamic'` (or `await params` alone) is the expected lever.
- Feature UI in `features/drill/client/components/`, never `src/components/`.
  `'use client'` only on the components with handlers or the keyboard hook.
- CVA in a sibling `*.variants.ts` for the delta's up/down/flat treatment;
  `data-slot` on every root element; named exports only except the page's
  default.
- No `any`; the delta is a typed value, not a stringly-typed cell.
- Theme tokens only — **no raw hex in a component**. Dark mode only.
- Geist Mono for every figure (scores, percentages, deltas, timestamps); Geist
  Sans for labels and prose.
- **No unnecessary comments.** Per `.claude/rules/principles.md`, comments
  explain _why_, never _what_ — the code already says what it does. Do not add
  section banners, `// Step 1:` sequences, a line that restates the line below
  it, or JSDoc that repeats a signature the types already carry. A comment
  earns its place only for a non-obvious invariant, a subtle ordering, or a
  decision whose reasoning is invisible in the code, and it stays to one line
  wherever possible. If the _why_ needs a paragraph, the design is too complex
  — simplify it instead of explaining it.

## Affected Areas

- [x] `apps/nextjs` — `features/drill/**`, `app/(public)/[cert]/drill/[runId]/summary/**`
- [ ] `apps/nextjs/prisma` (no schema or migration change — `DrillRun`,
      `Attempt` and their indexes all land in issue #2)
- [ ] `infra/` (untouched)
- [ ] `.github/` (untouched)

Exact expected file set (the anomaly gate blocks a diff that strays outside it):

**New**

- `apps/nextjs/src/app/(public)/[cert]/drill/[runId]/summary/page.tsx`
- `apps/nextjs/src/features/drill/server/api/getRunSummary.ts`
- `apps/nextjs/src/features/drill/server/api/getRunHistory.ts`
- `apps/nextjs/src/features/drill/client/components/RunSummary.tsx`
- `apps/nextjs/src/features/drill/client/components/RunHistoryTable.tsx`
- `apps/nextjs/src/features/drill/client/components/RunHistoryTable.variants.ts`
- `apps/nextjs/src/features/drill/client/components/MissReview.tsx`
- `apps/nextjs/src/features/drill/client/components/SummaryActions.tsx`
- `apps/nextjs/src/features/drill/client/hooks/useSummaryKeys.ts`
- `apps/nextjs/src/features/drill/client/lib/startRun.ts` — client caller for
  `POST /api/drill/runs`, used by both retry and weak spots (see Open Questions:
  this file may already exist if #7's plan added it)

**Modified**

- `apps/nextjs/src/features/drill/schemas/startRun.schema.ts` — only if the
  retry path needs a `fromRunId` discriminant. The plan must decide this
  explicitly; the recommendation below avoids the change.

## Acceptance Criteria

Verified in a browser through the `playwright` plugin against a seeded run
(the repo has no test runner), plus a database read where noted.

- [ ] Answering the final question of a run lands on
      `/[cert]/drill/<runId>/summary` and the page renders that run's score as
      `correct / total` in a `font-mono` element.
- [ ] The outcome breakdown lists correct, self-graded, missed and skipped as
      four separately labelled counts, and the four counts sum to the run's
      question count.
- [ ] A run answered with one self-graded "I had it" shows a self-graded count
      of 1 and includes that question in the correct total.
- [ ] Requesting the summary of an unfinished run sets `finishedAt` on that run
      exactly once (re-loading the page does not change the stored value).
- [ ] Requesting `/[cert]/drill/<unknown-id>/summary` renders the 404 page, not
      a 500 and not an empty summary.
- [ ] After two runs of the same scope, the history table shows two rows,
      newest first, and the current run's row is marked as the current one.
- [ ] The second run's row shows a signed delta whose value equals its
      percentage minus the first run's percentage, and whose text includes a
      sign or the word "even" — the delta is not conveyed by colour alone.
- [ ] The oldest row's delta cell renders an em dash, not `+0`.
- [ ] A run of a **different** scope does not appear in this run's history
      table.
- [ ] **Clicking "Retry same set" starts a new run whose `questionIds` array is
      element-for-element identical, in the same order, to the finished run's
      `questionIds`** (asserted by reading both rows from the database) and
      navigates to the new run's drill page.
- [ ] The first question shown in the retried run is the same question that was
      first in the original run.
- [ ] "Drill weak spots" is a separate control from "Retry same set" — the page
      contains two distinct buttons with distinct accessible names, and the
      weak-spots label does not contain the word "retry".
- [ ] Clicking "Drill weak spots" after a run with 3 misses starts a run whose
      question set is not identical to the finished run's `questionIds` and
      whose questions are drawn from the missed ones.
- [ ] Pressing `R` performs the retry and `W` performs weak spots; pressing `W`
      on a run with zero misses does nothing and no request is fired.
- [ ] "Review N misses" shows the actual miss count in its label, and expanding
      it reveals, for each missed question, the prompt, the user's response, the
      correct answer and the explanation.
- [ ] The review action is absent from the DOM on a run with no misses.
- [ ] A run in which every question was skipped renders `0 / 0` and `0%`, with
      no `NaN` anywhere in the page text.
- [ ] At a 1440px viewport the page body has no horizontal scrollbar even when
      the history table is wider than the column.
- [ ] At a 390×844 viewport: keyboard hints are hidden, and both primary action
      buttons are within the viewport's bottom third and at least 44px tall.
- [ ] `bun run check-types` and `bun run check-format` pass; no file under
      `src/components/` is touched; `page.tsx` contains no `'use client'`.
- [ ] No raw hex colour literal appears in any file added by this issue.

## Open Questions / Risks

- **How "drill weak spots" builds its set.** The design doc's `startRun(scope)`
  takes a scope, not a list of ids, and `ScopeKind` already has a `MISSED`
  member. Recommendation: weak spots starts a run with
  `scopeKind: MISSED, scopeValue: <the finished run's scopeValue>` and the
  engine builds the queue from questions in that scope whose current
  `QuestionProgress.state` is `WRONG`. Immediately after a run, the questions
  just missed are exactly those — so this needs **no** new parameter and no
  change to `startRun.schema.ts`. The alternative (passing `fromRunId`) is more
  literally "the questions just missed" but widens issue #6's schema from
  inside issue #9. Decide in `/plan`, not during implementation.
- **`getRunHistory` ownership — resolved: it belongs to #6.** Both specs
  claimed it. It is engine surface, and `#06`'s Functional section now
  specifies it, so **this issue consumes it rather than creating it** — drop
  it from this issue's file list at plan time. If #6 shipped without it, that
  is a gap in #6 to fix there, not to backfill here.
- **`startRun.ts` client caller ownership.** No issue in the backlog explicitly
  owns the client-side caller for `POST /api/drill/runs` — #5 (cert page) and
  #7 both plausibly need it. Whichever issue lands first creates it; the plan
  should check for its existence before adding it, and note in the PR if it did
  not need to.
- **"Skipped" is not in the data model.** A skip records no `Attempt` (issue
  #7), so skipped count must be derived as
  `questionIds.length − distinct answered questions` rather than read from a
  column. If a question is answered twice within one run, that derivation
  needs a `DISTINCT` on `questionId` — worth stating explicitly in the plan.
- **History grows without bound by design.** All runs are kept deliberately. At
  a few hundred runs the table is long; pagination or a "show all" fold is a
  future refinement, not a reason to prune data.
- **Retry equality is the criterion that matters most.** D7 exists because a
  reshuffle silently invalidates every comparison in the history table. The
  database-level array-equality check above is the one criterion that should
  never be softened into "looks the same".
- **No test runner** (design doc D11 — decided, none is added) — verification is Playwright plus direct
  database reads.
