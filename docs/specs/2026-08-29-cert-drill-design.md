# Design: Cert Drill — certification study app

> Status: Draft · 2026-08-29
> Type: **Design document** (architecture of record), not a per-issue spec.

This is the durable output of a brainstorming session. It is the upstream
reference every per-issue `/spec` should cite so that settled decisions are
not re-litigated one issue at a time.

**How this feeds `/run-backlog`:** the loop generates its own spec per GitHub
issue (`ready-for-agent` → `/spec` from the issue title + body). So this
document is _not_ consumed directly by the loop. Its job is to make each
issue's generated spec correct and consistent — every issue in
[Backlog decomposition](#backlog-decomposition) links back here.

---

## Problem / Context

This repo is a personal study tool for passing technical certifications
(LPIC-1 first, AWS later). A bank of 413 hand-collected LPIC-1 questions
already exists in `data/lpic1/{101,102}.json`, complete with per-question
objective codes, topics, and written explanations. Today it is inert JSON —
there is no way to practise against it, and no way to know which of the 42
objectives are actually weak.

The app that reads it does not exist yet. `apps/nextjs` is boilerplate: one
hero page, an empty `organisms/` layer, and `schema.prisma` with zero models.
Everything below is new construction on that scaffolding.

---

## Goals

- Practise the existing question bank one question at a time with immediate
  feedback and the explanation already written into the data.
- Know, at a glance, **what to study next** — per-objective mastery, not just
  a running score.
- Keep every answer ever given, so improvement over repeated runs is visible.
- Deliberately shelve questions for later revision, independent of whether
  they were answered correctly.
- Usable one-handed on a phone, dark mode only.

## Non-Goals

- **Timed mock-exam mode.** Considered and deferred — feedback arrives too
  late to teach. The data model does not block adding it later.
- **Spaced repetition (SM-2 / Leitner).** Considered and deferred — it
  assumes daily study over months, whereas this targets a fixed exam date.
- **Application-level authentication.** No `User` model, no sessions, no
  per-row ownership. Access is controlled at the edge instead (see
  [Access model](#access-model)).
- **Light mode.** The product commits to a single dark visual world.
- **Authoring questions in-app.** The bank is edited as JSON, outside the app.
- **Importing the AWS bank.** Structure supports it; no AWS data exists yet.

---

## Decisions

Each of these was an explicit fork during brainstorming. Recorded with the
reasoning so they are not silently reversed.

| #   | Decision                                                                                                                         | Rejected alternative                    | Why                                                                                                                                                                                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Progress lives in **Neon Postgres via Prisma**, `DATABASE_URL` resolved from Secrets Manager by the existing `getPrismaClient()` | Browser `localStorage`                  | Progress must survive across devices; the Secrets Manager wiring already exists and otherwise sits unused                                                                                    |
| D2  | **No app auth.** Lock the whole site at the Amplify edge                                                                         | Adding a real auth provider             | One implicit owner keeps the schema free of user scoping; edge basic auth is a few lines of Terraform vs. a whole auth subsystem                                                             |
| D3  | Fill-in grading is **hybrid**: auto-match, else self-grade                                                                       | Strict auto-grade; always self-grade    | 76% of fill-ins are ≤4 tokens and matchable; the remaining 24% are prose. Strict grading would mark you wrong on a quarter of them regardless of knowledge, making mastery numbers worthless |
| D4  | **Instant-feedback drill** is the only session mode                                                                              | Timed mock exam                         | Feedback that arrives at the end doesn't teach                                                                                                                                               |
| D5  | Questions are **seeded into Postgres** from JSON                                                                                 | Bundling JSON at build; reading from S3 | Gives `Attempt` a real FK; "never seen" is a `LEFT JOIN` and mastery a `GROUP BY`, instead of hand-rolled in TypeScript                                                                      |
| D6  | **Mastery-driven queue**: per-question state + per-objective rollups                                                             | Thin drill (counts only); full SRS      | With 413 questions the app's core job is choosing what to serve next; this is the smallest design that does it                                                                               |
| D7  | **Retry re-runs the identical question set**                                                                                     | Reshuffling on retry                    | A reshuffled set cannot tell you whether you improved. "Drill weak spots" is a separate action for a fresh set                                                                               |
| D8  | **Bookmarks are a separate shelf from "missed"**                                                                                 | A single "needs work" list              | The app already derives what you got wrong. A bookmark must mean what it _cannot_ infer: "revisit this" — including questions answered correctly for the wrong reason                        |

### Access model

The site is publicly deployed (real domain, WAF). Because progress rows carry
no user identity (D2), the site itself must not be publicly readable.
`aws_amplify_app` / `aws_amplify_branch` support `enable_basic_auth` +
`basic_auth_credentials`; credentials come from Secrets Manager, never from
`vars/*.tfvars` (per `.claude/rules/infra.md`).

> **This is human-only work.** `HUMAN-GATES.md` anomaly condition G2 #2 blocks
> _any_ branch whose diff touches `infra/**`, unconditionally. It must never be
> filed as a `ready-for-agent` issue. See [Human-only work](#human-only-work).

---

## Data model

Eight models. Content hierarchy mirrors the JSON (`cert → exam → topic /
objective → question`); progress is split into an immutable log and a
materialized current state.

```prisma
model Certification {
  id     String @id @default(cuid())
  slug   String @unique          // "lpic-1"
  name   String                  // "LPIC-1: Linux Administrator"
  vendor String                  // "Linux Professional Institute"
  exams  Exam[]
}

model Exam {
  id              String        @id @default(cuid())
  certificationId String
  certification   Certification @relation(fields: [certificationId], references: [id], onDelete: Cascade)
  code            String        // "101"
  title           String        // "Exam 101 Mixed"
  questions       Question[]
  @@unique([certificationId, code])
}

model Question {
  id              String            @id @default(cuid())
  examId          String
  exam            Exam              @relation(fields: [examId], references: [id], onDelete: Cascade)
  number          Int
  objective       String            // "101.1"
  topic           String            // "101 — System Architecture"
  prompt          String            // markdown; backticks preserved
  explanation     String
  type            QuestionType
  options         QuestionOption[]
  correctLetters  String[]          // ["B"] or ["A","B"]
  acceptedAnswers String[]          // normalized fill-in variants
  answerDisplay   String?           // original fill-in answer, rendered as markdown
  progress        QuestionProgress?
  bookmark        Bookmark?
  attempts        Attempt[]
  @@unique([examId, number])
  @@index([objective])
}

enum QuestionType { SINGLE_ANSWER  MULTIPLE_ANSWER  FILL_IN }

model QuestionOption {
  id         String   @id @default(cuid())
  questionId String
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  letter     String   // "A"
  text       String
  @@unique([questionId, letter])
}

/// Absence of a row means "unseen" — so seeding does not write 413 rows,
/// and "never touched" cannot drift out of sync with reality.
model QuestionProgress {
  questionId    String       @id
  question      Question     @relation(fields: [questionId], references: [id], onDelete: Cascade)
  state         MasteryState
  correctStreak Int          @default(0)
  timesSeen     Int          @default(0)
  timesCorrect  Int          @default(0)
  lastSeenAt    DateTime
  @@index([state])
}

enum MasteryState { WRONG  SHAKY  MASTERED }

model DrillRun {
  id          String    @id @default(cuid())
  scopeKind   ScopeKind
  scopeValue  String    // cert slug, exam code, topic, objective, or "bookmarks"
  questionIds String[]  // frozen set, in order — retry replays exactly this
  startedAt   DateTime  @default(now())
  finishedAt  DateTime?
  attempts    Attempt[]
  @@index([scopeKind, scopeValue, startedAt])
}

enum ScopeKind { CERT  EXAM  TOPIC  OBJECTIVE  MISSED  UNSEEN  BOOKMARKS }

/// Immutable log. Never updated, never deleted — this is what makes
/// "save all previous drill attempts" queryable rather than merely retained.
model Attempt {
  id         String   @id @default(cuid())
  runId      String?
  run        DrillRun? @relation(fields: [runId], references: [id], onDelete: SetNull)
  questionId String
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  isCorrect  Boolean
  response   String?  // what was typed or picked
  selfGraded Boolean  @default(false)
  createdAt  DateTime @default(now())
  @@index([questionId, createdAt])
  @@index([runId])
}

model Bookmark {
  questionId String   @id
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  note       String?
  createdAt  DateTime @default(now())
}
```

**Why `Attempt` _and_ `QuestionProgress`.** The log alone cannot answer "what
is this question's current state" without a per-question `DISTINCT ON`. The
materialized row turns every dashboard query into a plain `GROUP BY objective`.
Both are written together in a single `db.$transaction([...])` — the atomic
multi-step write `conventions.md` reserves that API for.

**Why `QuestionOption` is a table, not `Json`.** ~1,600 rows total. A `Json`
column needs casting on every read, and `typescript/no-explicit-any` is an
oxlint **error** in this repo; a relation stays typed end to end for free.

**Why `Bookmark` is its own table, not a flag on `QuestionProgress`.** That row
only exists once a question has been answered, but a question can be bookmarked
mid-read. A separate table also gives `note` somewhere to live and makes
"bookmarked" a clean drill scope.

### Mastery state transitions

Derived on write, from the attempt just recorded:

| Current    | Answer  | Next state                       |
| ---------- | ------- | -------------------------------- |
| _(no row)_ | correct | `SHAKY`, `correctStreak = 1`     |
| _(no row)_ | wrong   | `WRONG`, `correctStreak = 0`     |
| `WRONG`    | correct | `SHAKY`, `correctStreak = 1`     |
| `SHAKY`    | correct | `correctStreak = 2` → `MASTERED` |
| `MASTERED` | correct | `MASTERED`, streak++             |
| any        | wrong   | `WRONG`, `correctStreak = 0`     |

A self-graded "I had it" counts as correct with `selfGraded = true`.

**Queue priority:** `WRONG` → unseen → `SHAKY` → `MASTERED` (held back).
Objective mastery % = `MASTERED` questions ÷ total questions in that objective.

---

## Architecture

Follows `.claude/rules/architecture.md` — feature folders, server-only data
access, thin route handlers.

### Feature modules

```
src/features/
  catalog/       read side of the content tree
    server/api/  getCertifications, getCertification(slug), getExam(certSlug, code)
  drill/         the run engine
    server/api/  startRun(scope), getRun(id), submitAnswer(...), selfGrade(...),
                 finishRun(id), getRunHistory(scope)
    lib/         grade.ts (pure), normalizeAnswer.ts (shared with the seed script)
    schemas/     startRun.schema.ts, submitAnswer.schema.ts
    client/      DrillCard, ChoiceOptions, FillInField, SelfGradePanel, ExplanationPanel
  progress/      mastery rollups
    server/api/  getDashboard(), getObjectiveMastery(certSlug), getWeakestObjectives(certSlug)
  bookmarks/
    server/api/  listBookmarks(certSlug), toggleBookmark(questionId, note?)
    schemas/     bookmark.schema.ts
    client/      BookmarkToggle
```

`normalizeAnswer.ts` is imported by **both** the seed script and the runtime
grader, so the strings compared at answer time are produced by exactly the
code that produced the stored `acceptedAnswers`.

### Routes

Pages (Server Components, under `(public)/`):

| Route                           | Screen                                          |
| ------------------------------- | ----------------------------------------------- |
| `/`                             | Dashboard                                       |
| `/[cert]`                       | Certification → exams, topic mastery, doughnuts |
| `/[cert]/bookmarks`             | Bookmarks shelf                                 |
| `/[cert]/drill/[runId]`         | Drill                                           |
| `/[cert]/drill/[runId]/summary` | Run complete, retry, run history                |

Route handlers (thin — validate with Zod, call `server/api`, `NextResponse.json`):

| Handler                                   | Purpose                                         |
| ----------------------------------------- | ----------------------------------------------- |
| `POST /api/drill/runs`                    | Start a run from a scope; returns `runId`       |
| `POST /api/drill/runs/[runId]/answers`    | Submit an answer; returns verdict + explanation |
| `POST /api/drill/runs/[runId]/self-grade` | Resolve a no-match fill-in                      |
| `POST /api/drill/runs/[runId]/finish`     | Close the run                                   |
| `PUT /api/bookmarks/[questionId]`         | Create/update a bookmark (with optional note)   |
| `DELETE /api/bookmarks/[questionId]`      | Remove a bookmark                               |

All wrapped in `withRequestLogging`; failures are `AppError` throws converted
by that wrapper. `server/api` returns `ResultAsync` via `catchAsyncError`.

### Seed pipeline

`apps/nextjs/prisma/seed.ts`, exposed as a `db:seed` script. Idempotent
upsert keyed on `(exam.code, question.number)` so re-running is safe.

Fill-in parsing happens **at seed time**, not at runtime:

1. Strip backticks, lowercase, collapse whitespace.
2. Split on `or` / `/` into multiple `acceptedAnswers` **only when** the answer
   is ≤4 tokens and both sides look like code. Longer prose answers stay a
   single string and fall through to self-grade.
3. Store the untouched original as `answerDisplay` for rendering.

> That guard is load-bearing. Splitting
> ``"parameters `1` or `S` may be present in the kernel's parameter list"``
> on _or_ produces garbage; 64 of 234 fill-in answers contain `or` or `/`.

---

## Design language

Built on the tokens already in `src/styles/tokens/`. Reference mockup of all
eight screens: <https://claude.ai/code/artifact/847f0428-275e-4248-b543-1879f3268357>

- **Dark only.** Existing `.dark` palette: `#000` ground, `#090909` card,
  `#242424` hairline, `#fff` primary, `#a4a4a4` muted.
- **Type.** Geist Sans for UI and prose; **Geist Mono for all content** —
  commands, paths, objective codes, and every figure. The subject is the
  terminal; the mono face is the content's own vernacular.
- **New token — `--success: #39d98a`.** The palette ships `--destructive` but
  no success colour, and a quiz app cannot express its most important state
  without one. Luminance-matched to the existing red and amber. Semantic only.
- **Chart fills are darker than UI tokens, deliberately.** Large saturated
  areas read loud. Doughnut segments use steps computed into the OKLCH
  `0.48–0.67` band at the same brand hues, validated for colour-blind
  separation, chroma, and contrast against the `#090909` card:
  - outcomes — correct `#24a969`, self-graded `#a57218`, missed `#b02a2f`
  - question mix — fill-in `#a57218`, single `#4a8df5`, multiple `#a258c1`
- **A missed fill-in is amber, never red.** "Your string didn't match" and
  "you didn't know it" are different facts; conflating them destroys trust in
  the mastery numbers.
- **The drill screen drops navigation entirely** — one column, keyboard-driven
  (`A`–`D`, `↵`, `S` skip, `B` bookmark, `Y`/`N` self-grade).
- **Responsive is a requirement of every UI issue, not a later pass.** On
  phones the rail becomes a 4-item bottom tab bar (Study / Saved / Runs /
  Stats), options become full-width tap targets, keyboard hints are hidden,
  and every primary action pins to the thumb zone.

Component placement per `conventions.md`: cross-feature UI in
`src/components/{atoms,molecules,organisms}` with CVA variants and
`data-slot`; feature UI in `features/<name>/client/components/`.

---

## Constraints

- Zod validation at the boundary only; schemas in `features/<name>/schemas/`.
- `server/api` starts with `const db = await getPrismaClient()`. No model layer.
- Multi-step writes (attempt + progress upsert) use `db.$transaction([...])`.
- Named exports only, except where Next.js requires a default.
- Cache Components is **off** — `'use cache'`, `cacheLife`, `cacheTag` are
  unavailable. Use route segment config, and `unstable_cache` with `tags` for
  Prisma reads that need invalidating on write.
- No `NEXT_PUBLIC_*` variables. Client code uses relative `/api/...` paths.
- `any` is an oxlint error.

---

- **No unnecessary comments.** Per `.claude/rules/principles.md`, comments
  explain _why_, never _what_ — the code already says what it does. Do not add
  section banners, `// Step 1:` sequences, a line that restates the line below
  it, or JSDoc that repeats a signature the types already carry. A comment
  earns its place only for a non-obvious invariant, a subtle ordering, or a
  decision whose reasoning is invisible in the code, and it stays to one line
  wherever possible. If the _why_ needs a paragraph, the design is too complex
  — simplify it instead of explaining it.

## Open Questions / Risks

### D9 — the question bank stays private; agents get a fixture (resolved)

> Moved out of Open Questions on 2026-08-29 — this is now a decision, and
> `docs/specs/2026-08-29-03-seed-pipeline.md` is written against it.

`.gitignore:46` ignores `/data/`, so the 413-question bank is **not in git**.
That is deliberate: the repo is public and the bank is collected exam
material. Three consequences follow, and the resolution accepts all of them:

1. The seed cannot run in CI or in an Amplify build — the files aren't there.
2. `git worktree` checkouts contain only tracked files, so **`backlog-runner`'s
   per-issue worktrees do not contain `data/`** — the same gap the loop
   already works around for `apps/nextjs/.env` by copying it in.
3. Therefore `db:seed` against the real bank is a **human action run from a
   local machine**, exactly like `db:migrate`. See [Human-only work](#human-only-work).

**Resolution:** commit `apps/nextjs/prisma/fixtures/sample.json` — a small,
hand-picked set covering all three question types, at least one multi-variant
fill-in (`` `-H or —human` ``) and at least one prose fill-in that must fall
through to self-grade. The seed script takes a path argument and defaults to
the fixture, so agents, worktrees, and any future test run end-to-end against
real data without the private bank ever being committed.

### D10 — route handlers, not Server Actions (resolved)

> Was R2. Decided 2026-08-29.

`architecture.md` documents route handlers and says nothing about Server
Actions. Answer submission is a tight client→server loop that Server Actions
would fit well, but adopting them is a convention change, and this feature is
not the place to make one incidentally. **All mutations go through route
handlers**, as every server-touching spec already assumes.

### D11 — no test runner is introduced by this feature (resolved)

> Was R4. Decided 2026-08-29.

This repo has no test runner and this feature does not add one. Verification
is: the type-checker, `oxlint`/`oxfmt`, Playwright for UI, and manual route
exercise for server logic.

**The cost is concentrated in two pure functions.** `grade.ts` and
`normalizeAnswer.ts` carry the correctness of the entire grading model, and
their specs' normalization criteria are verified by a throwaway script or a
REPL rather than anything that re-runs. Nothing prevents a later edit from
silently regressing them — in particular, editing `normalizeAnswer.ts` after
a seed invalidates every stored `acceptedAnswers` with no failing check to
say so. Issue #3's spec states that file is effectively frozen once seeded;
with no runner, that rule is enforced by review alone.

Adding a runner later remains open, and would be its own issue.

### R3 — `agent:*` labels do not exist yet

`gh label list` shows only stock labels. `.claude/skills/backlog-runner/scripts/bootstrap_labels.sh`
must be run once before the first `/run-backlog`.

### D12 — the `dark` class gets its own issue (resolved)

> Was R6. Decided 2026-08-29.

`app/layout.tsx` renders `<html lang="en">` with no `dark` class and no theme
provider, so the entire `.dark` block was **inert** — the dark-only commitment
existed on paper, not in the running app. This was deliberately kept out of
issue #1's single-file scope. Rather than widen #1 (which would break its
"only `colors.css` changes" constraint and its browser-based acceptance
criteria, written against an explicit `.dark` wrapper for exactly this
reason), it gets its own issue: **#11**, a one-line, zero-dependency change to
`app/layout.tsx`. It must land before issues #5 and #7–#9, whose screens all
assume the dark palette renders — see
[11-dark-mode-root](./2026-08-29-11-dark-mode-root.md).

> **Superseded 2026-09-02** by issue #44 — see
> [theme-toggle-system-preference](./2026-09-02-theme-toggle-system-preference.md).
> The dark-only commitment this decision made is reversed: theming now
> follows OS preference by default, with a light/dark/system toggle.

### R5 — Doughnut with a 1% slice

Exam 101 has only 2 multiple-answer questions. At that share the arc is nearly
invisible; every segment is therefore directly labelled with its count. If the
figures matter more than the shape, that panel should be a bar.

---

## Backlog decomposition

Sized so each issue is one `/plan` → `/implement` cycle touching a bounded
file set — `backlog-runner`'s anomaly gate G2 #3 blocks a branch whose diff
strays outside the files its plan names, so **narrow issues are a correctness
requirement, not a preference**.

Order matters. 1, 2, and 11 have no dependencies and can start immediately, in
parallel; 3 is strictly sequential after 2.

**Each issue has its own spec.** The linked file is the authority on that
issue's requirements and acceptance criteria; this table is only the index and
the dependency order.

| #   | Spec                                                             | Issue                                                                  | Depends on | Touches                                                                             |
| --- | ---------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------- |
| 1   | [01-theme-success-token](./2026-08-29-01-theme-success-token.md) | Add `--success` and chart-fill tokens to the theme                     | —          | `src/styles/tokens/colors.css`                                                      |
| 2   | [02-prisma-schema](./2026-08-29-02-prisma-schema.md)             | Prisma schema + migration for content, progress, runs, bookmarks       | —          | `prisma/schema.prisma`, `prisma/migrations/**`                                      |
| 3   | [03-seed-pipeline](./2026-08-29-03-seed-pipeline.md)             | Seed pipeline: JSON → Postgres, with fill-in answer normalization      | 2, D9      | `prisma/seed.ts`, `prisma/fixtures/**`, `features/drill/lib/normalizeAnswer.ts`     |
| 4   | [04-catalog-dashboard](./2026-08-29-04-catalog-dashboard.md)     | Catalog read layer + dashboard page                                    | 2, 3       | `features/catalog/**`, `features/progress/**`, `app/(public)/(main)/page.tsx`       |
| 5   | [05-certification-page](./2026-08-29-05-certification-page.md)   | Certification page: exams, topic mastery, doughnut charts              | 1, 4, 11   | `features/catalog/**`, `app/(public)/[cert]/**`, `components/molecules/**`          |
| 6   | [06-drill-engine](./2026-08-29-06-drill-engine.md)               | Drill engine: start run, serve queue, grade, record attempt + progress | 2, 3       | `features/drill/server/**`, `features/drill/lib/**`, `app/api/drill/**`             |
| 7   | [07-drill-ui-choice](./2026-08-29-07-drill-ui-choice.md)         | Drill UI: choice questions, answered state, explanation                | 1, 6, 11   | `features/drill/client/**`, `app/(public)/[cert]/drill/**`                          |
| 8   | [08-drill-ui-fillin](./2026-08-29-08-drill-ui-fillin.md)         | Drill UI: fill-in field, no-match verdict, self-grade                  | 6, 7       | `features/drill/client/**`                                                          |
| 9   | [09-run-summary-retry](./2026-08-29-09-run-summary-retry.md)     | Run summary, retry same set, run history                               | 6, 7, 11   | `features/drill/**`, `app/(public)/[cert]/drill/[runId]/summary/**`                 |
| 10  | [10-bookmarks](./2026-08-29-10-bookmarks.md)                     | Bookmarks: toggle, shelf page, drill scope                             | 2, 6       | `features/bookmarks/**`, `app/api/bookmarks/**`, `app/(public)/[cert]/bookmarks/**` |
| 11  | [11-dark-mode-root](./2026-08-29-11-dark-mode-root.md)           | Apply the dark theme to the app root                                   | —          | `app/layout.tsx`                                                                    |

Every GitHub issue body should carry: the goal, a link to its spec above, and
the "Affected Areas" file list copied from that spec — the anomaly gate reads
the plan's file list, and the plan is derived from the issue.

### Cross-issue ownership

Three pieces of surface sat between two issues each. Settled here so two plans
cannot both claim them, or both skip them:

| Surface                                                    | Owner                                | Note                                                                                                                                              |
| ---------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getRunHistory`                                            | **#6**                               | Engine surface. #9 consumes it.                                                                                                                   |
| Client caller for `POST /api/drill/runs`                   | **whichever of #5 / #7 lands first** | The later one checks for it before adding, and says so in its PR.                                                                                 |
| Drill entry route `/{cert}/drill?scopeKind=…&scopeValue=…` | **#7**                               | Invented by #4's links; absent from the route table above. #7 starts the run and redirects to `/[cert]/drill/[runId]`.                            |
| Bookmark button in `QuestionMeta.tsx`                      | **#7 places, #10 replaces**          | #7 ships a presentational placeholder with no network call; #10 swaps in the real `BookmarkToggle` and lists that file in its own Affected Areas. |

### Human-only work

Never file these as `ready-for-agent` — G2 #2 blocks any `infra/**` diff
unconditionally, and `.claude/rules/infra.md` forbids unattended state changes.

- Amplify edge basic auth ([D2](#decisions)) — `infra/modules/amplify`, plus
  the credential in Secrets Manager.
- Running `bootstrap_labels.sh` (R3).
- Running `db:migrate` against Neon, and `db:seed` against the **real**
  `data/lpic1/` bank ([D9](#d9--the-question-bank-stays-private-agents-get-a-fixture-resolved))
  — agents only ever seed the committed fixture.
