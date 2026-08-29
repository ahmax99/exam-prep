# Spec: Drill engine — start run, serve queue, grade, record attempt

> Status: Draft · 2026-08-29
> Design of record: [docs/specs/2026-08-29-cert-drill-design.md](./2026-08-29-cert-drill-design.md)
> Backlog issue: **#6** (depends on **#2** schema, **#3** seed)

## Problem / Context

Issues #2 and #3 put 413 questions and their normalized fill-in answers into
Postgres. Nothing yet decides **which** question to serve, judges an answer, or
records what happened — the tables are inert.

This issue builds that engine, server-side and headless. Every UI issue that
follows (#7 choice questions, #8 fill-in, #9 summary and retry) is a renderer
over the contract defined here, so the contract has to be settled before any of
them start. Getting it wrong is expensive in a way the UI issues are not: an
`Attempt` row is immutable history, and a mis-specified verdict corrupts the
mastery numbers the whole product exists to produce.

Two decisions from the design doc are load-bearing here and are the reason this
is not a generic quiz backend:

- **D7** — a run freezes its question set, because retry must replay _exactly_
  the same questions in the same order. A reshuffled retry cannot tell you
  whether you improved.
- **D3** — a fill-in that matches nothing is **not wrong**. It is a third
  verdict the server refuses to judge, deferring to the user.

## Goals

- A run can be started for any scope (cert, exam, topic, objective, missed,
  unseen, bookmarks) and serves questions in a deliberate priority order.
- An answer is graded and recorded such that per-objective mastery is a plain
  SQL aggregate afterwards, never a TypeScript reduction.
- Every answer ever given is retained, attributable to the run it belonged to.
- Retry of a past run replays that run's exact question set.
- The grading rules live in one pure function that the UI cannot bypass.

## Non-Goals

- **Any UI.** No components, no pages, no `'use client'`. Issues #7–#9 own that.
- **Timed exam mode / spaced repetition.** Out of scope per the design doc's
  Non-Goals; the schema does not block them later.
- **Bookmark writes.** `scopeKind: BOOKMARKS` must _read_ bookmarks to build a
  queue, but creating and deleting them is issue #10.
- **The summary page and run-history UI.** `getRunHistory` is implemented here
  because it is engine surface; rendering it is issue #9.
- **Caching.** No `unstable_cache` in this issue — these are per-request
  mutations and reads whose freshness is the point.

## Requirements

### Functional

**`startRun(scope)`**

- Accepts `{ scopeKind, scopeValue, certSlug, limit? }`.
- `scopeValue` disambiguates within `certSlug`: an exam `code` for `EXAM`, a
  topic string for `TOPIC`, an objective code for `OBJECTIVE`. For `CERT`,
  `MISSED`, `UNSEEN` and `BOOKMARKS` there is nothing to disambiguate, so
  `scopeValue` is the empty string — the scope is fully described by
  `scopeKind` + `certSlug`.
  > The design doc leaves this ambiguous ("cert slug, exam code, topic,
  > objective, or `bookmarks`"). This spec is the resolution; `scopeValue` is
  > never redundant with `certSlug`.
- Resolves the candidate question set for the scope, then **orders it by queue
  priority**: `WRONG` → unseen (no `QuestionProgress` row) → `SHAKY` →
  `MASTERED`. Within a priority band, order is stable and deterministic
  (by `exam.code`, then `question.number`).
- `MASTERED` questions are **held back**: excluded entirely unless the scope
  would otherwise yield fewer than `limit` questions.
- Persists the resulting ordered ids to `DrillRun.questionIds` and returns the
  run. **The set is frozen at creation** — later calls never re-derive it.
- Returns a domain error if the scope resolves to zero questions; it must not
  create an empty run.

**`getRun(id)`** — returns the run, its ordered questions with options, and
which of its questions already have an `Attempt` for this run (so the UI can
resume mid-run and show `seen N/total`).

**`submitAnswer({ runId, questionId, response })`**

- Rejects a `questionId` not in that run's `questionIds`.
- Grades via `grade.ts` (below) and returns
  `{ verdict, correctLetters, answerDisplay, explanation }`.
- `verdict` is one of **`matched` | `wrong` | `no-match`**, matching the
  vocabulary issue #8 renders.
- For `matched` and `wrong`: writes the `Attempt` **and** upserts
  `QuestionProgress` in **one `db.$transaction([...])`**.
- For `no-match` (fill-in only): writes **nothing**. The outcome is not yet
  decided — `selfGrade` completes it. This is the single most important
  contract in this issue.
- Submitting twice for the same `(runId, questionId)` is rejected, so a
  double-click cannot write two attempts.

**`selfGrade({ runId, questionId, hadIt })`**

- Valid only where the prior `submitAnswer` returned `no-match`; otherwise a
  domain error.
- Writes the `Attempt` with `isCorrect = hadIt` and **`selfGraded: true`**, and
  upserts `QuestionProgress`, in one transaction.

**`finishRun(id)`** — sets `finishedAt`; idempotent (a second call is a no-op,
not an error). Returns the run's score.

**`getRunHistory({ scopeKind, scopeValue, certSlug })`** — every `DrillRun`
for that exact scope, newest first, each with its score and total. Used by
issue #9 to show the slope across runs.

**`grade.ts` — a pure function**

- Signature takes the question (type, `correctLetters`, `acceptedAnswers`) and
  the raw response, and returns a verdict. **No database access, no imports
  from `server/`.**
- `SINGLE_ANSWER` — `matched` iff the chosen letter equals the single
  `correctLetters` entry.
- `MULTIPLE_ANSWER` — `matched` iff the chosen set equals `correctLetters` as a
  **set** (order-independent, exact — no partial credit).
- `FILL_IN` — normalizes the response with the **same `normalizeAnswer` module
  issue #3 used to build `acceptedAnswers`**, then returns `matched` on set
  membership, else `no-match`. A fill-in never returns `wrong` from grading.

**Mastery transitions** — applied on every `QuestionProgress` upsert, exactly
as tabulated in the design doc: no row + correct → `SHAKY` streak 1; no row +
wrong → `WRONG`; `WRONG` + correct → `SHAKY` streak 1; `SHAKY` + correct →
streak 2 → `MASTERED`; `MASTERED` + correct → streak++; **any + wrong →
`WRONG`, streak 0**. `timesSeen` and `timesCorrect` increment accordingly and
`lastSeenAt` is set.

**Route handlers** — thin: validate with Zod, call `server/api`, `NextResponse.json`.

| Handler                                   | Body                       |
| ----------------------------------------- | -------------------------- |
| `POST /api/drill/runs`                    | scope                      |
| `POST /api/drill/runs/[runId]/answers`    | `{ questionId, response }` |
| `POST /api/drill/runs/[runId]/self-grade` | `{ questionId, hadIt }`    |
| `POST /api/drill/runs/[runId]/finish`     | —                          |

### Constraints

- `server/api` functions begin with `const db = await getPrismaClient()`; no
  model layer.
- Zod schemas live in `features/drill/schemas/*.schema.ts` and validate at the
  route boundary **only** — never inside `server/api`.
- Route handlers are wrapped in `withRequestLogging`; failures are `AppError`
  throws with codes from `features/error/constants/errorDefinition.ts`.
- `server/api` returns `ResultAsync` via `catchAsyncError`; `catchSyncError`
  for expected parse failures.
- The attempt + progress write is `db.$transaction([...])` (array form, real
  `PrismaPromise`s).
- Named exports only; `const` arrow functions; no `any`.
- `switch` over the `QuestionType` / verdict discriminants, not `else-if`.
- No `'use cache'` / `cacheLife` / `cacheTag` — Cache Components is off.
- Never leak stack traces in a response body.
- **No unnecessary comments.** Per `.claude/rules/principles.md`, comments
  explain _why_, never _what_ — the code already says what it does. Do not add
  section banners, `// Step 1:` sequences, a line that restates the line below
  it, or JSDoc that repeats a signature the types already carry. A comment
  earns its place only for a non-obvious invariant, a subtle ordering, or a
  decision whose reasoning is invisible in the code, and it stays to one line
  wherever possible. If the _why_ needs a paragraph, the design is too complex
  — simplify it instead of explaining it.

## Affected Areas

- [x] `apps/nextjs/src/features/drill/server/api/index.ts`
- [x] `apps/nextjs/src/features/drill/lib/grade.ts`
- [x] `apps/nextjs/src/features/drill/lib/queue.ts` (scope → ordered ids)
- [x] `apps/nextjs/src/features/drill/lib/mastery.ts` (transition table)
- [x] `apps/nextjs/src/features/drill/schemas/startRun.schema.ts`
- [x] `apps/nextjs/src/features/drill/schemas/submitAnswer.schema.ts`
- [x] `apps/nextjs/src/features/drill/schemas/selfGrade.schema.ts`
- [x] `apps/nextjs/src/app/api/drill/runs/route.ts`
- [x] `apps/nextjs/src/app/api/drill/runs/[runId]/answers/route.ts`
- [x] `apps/nextjs/src/app/api/drill/runs/[runId]/self-grade/route.ts`
- [x] `apps/nextjs/src/app/api/drill/runs/[runId]/finish/route.ts`
- [ ] Reuses `features/drill/lib/normalizeAnswer.ts` from issue #3 — **read
      only, must not be modified**; changing it would silently invalidate every
      stored `acceptedAnswers`.

## Acceptance Criteria

Verifiable against a running dev server with the fixture seeded (issue #3).

- [ ] `POST /api/drill/runs` with an unknown `scopeKind` returns **400**, and
      the body contains no stack trace.
- [ ] `POST /api/drill/runs` for a scope with zero matching questions returns a
      **4xx** error and creates **no** `DrillRun` row.
- [ ] A run created for an objective containing a previously-wrong question
      returns that question **first** in `questionIds`.
- [ ] Two runs created back-to-back for the same scope, with no answers in
      between, produce **identical** `questionIds` arrays (deterministic order).
- [ ] `POST .../answers` with a `questionId` absent from the run's
      `questionIds` returns **400** and writes no `Attempt`.
- [ ] Answering a `SINGLE_ANSWER` question correctly returns
      `verdict: "matched"` and creates exactly **one** `Attempt` row and
      **one** `QuestionProgress` row.
- [ ] A `MULTIPLE_ANSWER` question answered `["A"]` when `correctLetters` is
      `["A","B"]` returns `verdict: "wrong"` — partial credit is not awarded.
- [ ] The same question answered `["B","A"]` returns `verdict: "matched"` —
      set equality, order-independent.
- [ ] A fill-in answered with an exact accepted variant returns
      `verdict: "matched"`.
- [ ] A fill-in answered `systemctl isolate multi-user` (against expected
      `systemctl isolate multi-user.target`) returns **`verdict: "no-match"`**,
      and **no `Attempt` and no `QuestionProgress` row are written**.
- [ ] Following that with `POST .../self-grade` `{ hadIt: true }` creates one
      `Attempt` with `isCorrect = true` **and `selfGraded = true`**.
- [ ] `POST .../self-grade` for a question whose last submit was `matched`
      returns a **4xx** error.
- [ ] Submitting the same `(runId, questionId)` twice returns a **4xx** on the
      second call, and the `Attempt` count for that pair stays at 1.
- [ ] A question with no prior progress answered correctly lands in state
      `SHAKY` with `correctStreak = 1`; answered correctly again it becomes
      `MASTERED`.
- [ ] A `MASTERED` question answered incorrectly returns to `WRONG` with
      `correctStreak = 0`.
- [ ] `POST .../finish` twice returns **200** both times and leaves a single
      `finishedAt` value unchanged after the first call.
- [ ] `getRunHistory` for a scope with three completed runs returns three
      entries, newest first, each carrying a score and total.
- [ ] `grade.ts` contains no import from `server/`, `@/lib/prisma`, or
      `next/*` — verifiable by grep.
- [ ] `bun run check-types` and `bun run check-format` both pass.

## Open Questions / Risks

- **Concurrency on double-submit.** The "reject a second submit" criterion is
  specified as a uniqueness property. Whether it is enforced by a DB constraint
  on `(runId, questionId)` or a read-then-write inside the transaction is a
  plan-time choice — but a bare read-then-write outside the transaction is not
  acceptable, since it races.
- **`MASTERED` hold-back vs. small scopes.** An objective where every question
  is mastered would yield an empty run under the hold-back rule. The stated
  fallback (include mastered when the scope is short) needs a concrete
  threshold at plan time.
- **`Attempt.runId` is nullable** in the schema (`onDelete: SetNull`), so
  history survives a deleted run. Nothing in this issue deletes runs; the
  nullability exists for that future.
- **Server Actions** would suit the answer-submit loop better than route
  handlers, but `architecture.md` documents handlers and says nothing about
  Actions. Following the documented convention here; see design doc **D10**.
