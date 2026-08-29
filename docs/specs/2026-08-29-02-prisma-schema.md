# Spec: Prisma schema + migration for content, progress, runs, bookmarks

> Status: Draft · 2026-08-29
> Design of record: [docs/specs/2026-08-29-cert-drill-design.md](./2026-08-29-cert-drill-design.md)
> Backlog issue: **#2** (no dependencies; blocks #3, #4, #6, #10)

## Problem / Context

`apps/nextjs/prisma/schema.prisma` declares a generator and a datasource and
**zero models**. Everything Cert Drill needs — the question bank, per-question
mastery, the immutable attempt log, drill runs, bookmarks — has nowhere to
live. Until the schema exists, the seed pipeline (#3) has no target, the
catalog and drill features (#4, #6) have nothing to query, and
`getPrismaClient()` returns a client with an empty model surface.

The schema is already fully designed. The
[Data model](./2026-08-29-cert-drill-design.md#data-model) section of the
design doc contains the complete Prisma block, the reasoning behind each
non-obvious shape, and the mastery state-transition table. This issue is
about landing it faithfully — including the constraints that later features
silently depend on — not about redesigning it.

## Goals

- The content hierarchy from the JSON bank (`certification → exam → question →
option`) is representable, with the natural keys that make seeding
  idempotent.
- Per-question mastery is a materialized row, so "what should I study next"
  and "how mastered is objective 101.1" are ordinary indexed queries rather
  than TypeScript over a full attempt log.
- Every answer ever given is retained in an append-only log that survives
  question edits and run deletion.
- Drill runs freeze their question set, so "retry" can replay exactly the same
  questions in the same order.
- Bookmarks are storable independently of whether a question has ever been
  answered.
- `bun run db:generate` produces a fully typed client with no `any` anywhere in
  the call sites that will consume it.

## Non-Goals

- **Writing any query.** No `server/api` function, no `getPrismaClient()`
  caller, no route handler. Those are issues #4, #6, and #10.
- **Seeding.** No data is written by this issue — that is issue #3.
- **Running the migration against Neon.** Applying to the real database is
  [human-only work](./2026-08-29-cert-drill-design.md#human-only-work), like
  `db:migrate` already is.
- **A `User` model or any per-row ownership.** Decision D2: the app has no
  authentication; access is controlled at the Amplify edge. Nothing in this
  schema carries a user identity.
- **Spaced-repetition fields.** No `dueAt`, `interval`, or `easeFactor` —
  deferred per the design doc's Non-Goals.
- **Timed-exam fields.** No per-question timer or run deadline.
- **AWS certification data.** The shape supports it; no rows exist.

## Requirements

### Functional

- Reproduce the models, fields, types, defaults, relations, and attributes
  exactly as specified in the design doc's
  [Data model](./2026-08-29-cert-drill-design.md#data-model) Prisma block.
  That block is the source of truth; this spec states the properties that must
  hold, not a second copy of the schema.
- **Eight models** must exist: `Certification`, `Exam`, `Question`,
  `QuestionOption`, `QuestionProgress`, `DrillRun`, `Attempt`, `Bookmark`.
  (The design doc's prose says "six models" while its own code block declares
  eight — see Open Questions. The code block wins.)
- **Three enums** must exist: `QuestionType` (`SINGLE_ANSWER`,
  `MULTIPLE_ANSWER`, `FILL_IN`), `MasteryState` (`WRONG`, `SHAKY`,
  `MASTERED`), `ScopeKind` (`CERT`, `EXAM`, `TOPIC`, `OBJECTIVE`, `MISSED`,
  `UNSEEN`, `BOOKMARKS`).
- **Uniqueness constraints** — each of these is load-bearing for a specific
  downstream behaviour and must be present:

  | Constraint                                      | Why it exists                                                             |
  | ----------------------------------------------- | ------------------------------------------------------------------------- |
  | `Certification.slug @unique`                    | URL segment `/[cert]` resolves a certification by slug                    |
  | `Exam @@unique([certificationId, code])`        | Exam codes (`101`, `102`) are only unique within a certification          |
  | `Question @@unique([examId, number])`           | The seed's idempotent upsert key (#3); re-running must not duplicate rows |
  | `QuestionOption @@unique([questionId, letter])` | Lets the seed upsert options individually instead of delete-and-recreate  |

- **Indexes** — each supports a query a later issue will make:

  | Index                                                  | Query it serves                                     |
  | ------------------------------------------------------ | --------------------------------------------------- |
  | `Question @@index([objective])`                        | Per-objective mastery rollup (`GROUP BY objective`) |
  | `QuestionProgress @@index([state])`                    | Queue priority: pull all `WRONG` questions first    |
  | `DrillRun @@index([scopeKind, scopeValue, startedAt])` | Run history for a given scope, newest first         |
  | `Attempt @@index([questionId, createdAt])`             | A question's answer history in order                |
  | `Attempt @@index([runId])`                             | All attempts belonging to one run (summary page)    |

- **Referential actions.** Every relation cascades on delete from its parent
  (`Certification → Exam → Question → {QuestionOption, QuestionProgress,
Attempt, Bookmark}`) **except** `Attempt.run`, which is `onDelete: SetNull`
  with a nullable `runId`. Deleting a run must never delete the answers given
  during it — the log is the durable record, the run is the container.
- **`QuestionProgress` uses `questionId` as its primary key**, not a separate
  `cuid`. The row is a 1:1 materialization of a question's current state; a
  surrogate key would allow two progress rows for one question.
- **Absence of a `QuestionProgress` row means "unseen."** No default row, no
  `UNSEEN` enum member, no seed-time backfill. Consequences that must hold:
  seeding 413 questions writes zero progress rows, "never touched" cannot
  drift out of sync with reality, and the unseen queue is a `LEFT JOIN … WHERE
progress IS NULL`. `MasteryState` therefore deliberately has **no** `UNSEEN`
  member.
- **`QuestionOption` is a relation, not a `Json` column.** ~1,600 option rows
  total. A `Json` column would need casting on every read, and
  `typescript/no-explicit-any` is an oxlint **error** in this repo — a `Json`
  read would push callers toward `any` or hand-written casts. A relation stays
  typed end to end at no cost, and gives `@@unique([questionId, letter])`
  somewhere to attach.
- **`Bookmark` is its own table, not a flag on `QuestionProgress`.** A progress
  row only exists once a question has been answered, but a question can be
  bookmarked mid-read. A separate table also gives `note` a home and makes
  `BOOKMARKS` a clean drill scope.
- **`DrillRun.questionIds` is a `String[]`, deliberately not a relation.** It
  freezes the set _and the order_ at run creation so retry replays exactly the
  same sequence (decision D7). It carries no FK integrity — that is the
  accepted cost of freezing order in one column.
- **`Question.acceptedAnswers` and `Question.correctLetters` are `String[]`.**
  `acceptedAnswers` holds the normalized fill-in variants produced by issue #3;
  `answerDisplay` (nullable) holds the untouched original for rendering.
- **Mastery state transitions.** The schema must be able to express this table
  (derived on write from the attempt just recorded — the transition _logic_
  ships with issue #6, but the fields it needs land here):

  | Current    | Answer  | Next state                       |
  | ---------- | ------- | -------------------------------- |
  | _(no row)_ | correct | `SHAKY`, `correctStreak = 1`     |
  | _(no row)_ | wrong   | `WRONG`, `correctStreak = 0`     |
  | `WRONG`    | correct | `SHAKY`, `correctStreak = 1`     |
  | `SHAKY`    | correct | `correctStreak = 2` → `MASTERED` |
  | `MASTERED` | correct | `MASTERED`, streak++             |
  | any        | wrong   | `WRONG`, `correctStreak = 0`     |

  Concretely this requires `state`, `correctStreak`, `timesSeen`,
  `timesCorrect`, and `lastSeenAt` on `QuestionProgress`, and `isCorrect`,
  `response`, and `selfGraded` on `Attempt`. A self-graded "I had it" is
  recorded as `isCorrect = true` with `selfGraded = true`, so it counts toward
  mastery _and_ stays distinguishable in the outcomes chart.

- **A migration is committed** under `apps/nextjs/prisma/migrations/` as a
  timestamped directory containing `migration.sql`, alongside the existing
  `migration_lock.toml`.

### Constraints

- Only `apps/nextjs/prisma/schema.prisma` and
  `apps/nextjs/prisma/migrations/**` change. No `src/**`, no `package.json`,
  no `prisma.config.ts`.
- `apps/nextjs/prisma/generated/**` is git-ignored and regenerated by
  `db:generate`; it must not appear in the diff.
- The datasource block stays as-is — `provider = "postgresql"` with no `url`.
  The URL comes from `prisma.config.ts` (`env('DATABASE_URL')`) locally and
  from Secrets Manager at runtime via `getPrismaClient()`.
- The generator block stays as-is (`provider = "prisma-client"`,
  `output = "./generated"`).
- **The migration SQL must be generated without a live database.** The agent
  running this issue has no Neon credentials, and
  `.claude/rules/infra.md` plus the design doc's Human-only work section
  forbid unattended state changes. Use
  `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`
  and write the output into a new timestamped migration directory. Do **not**
  run `prisma migrate dev`, `db push`, `migrate deploy`, or `migrate reset`.
- Prisma 7 (`prisma@^7.9.1`, `@prisma/client@^7.10.0`) with the Neon serverless
  adapter. Do not introduce `previewFeatures` or change the client provider.
- No field or model may carry a user/owner identity (D2).
- **No unnecessary comments.** Per `.claude/rules/principles.md`, comments
  explain _why_, never _what_ — the code already says what it does. Do not add
  section banners, `// Step 1:` sequences, a line that restates the line below
  it, or JSDoc that repeats a signature the types already carry. A comment
  earns its place only for a non-obvious invariant, a subtle ordering, or a
  decision whose reasoning is invisible in the code, and it stays to one line
  wherever possible. If the _why_ needs a paragraph, the design is too complex
  — simplify it instead of explaining it.

## Affected Areas

- [x] `apps/nextjs/prisma/schema.prisma` — eight models, three enums
- [x] `apps/nextjs/prisma/migrations/<timestamp>_<name>/migration.sql` — one
      new migration directory (`migration_lock.toml` already exists and is
      unchanged)
- [ ] `apps/nextjs/src/**` — no source changes
- [ ] `apps/nextjs/package.json` — no script changes (`db:generate`,
      `db:migrate`, `db:deploy` already exist)
- [ ] `apps/nextjs/prisma.config.ts` — unchanged
- [ ] `infra/**` — must not be touched (G2 #2 blocks unconditionally)

## Acceptance Criteria

- [ ] `git diff --stat` lists only `apps/nextjs/prisma/schema.prisma` and files
      under `apps/nextjs/prisma/migrations/`.
- [ ] `bunx prisma validate --config prisma.config.ts` (from `apps/nextjs`)
      exits 0.
- [ ] `bun run db:generate` (from `apps/nextjs`) exits 0 and writes eight model
      files into `prisma/generated/models/`.
- [ ] After generation, a TypeScript file that references
      `db.certification`, `db.exam`, `db.question`, `db.questionOption`,
      `db.questionProgress`, `db.drillRun`, `db.attempt`, and `db.bookmark`
      type-checks — `bun run check-types` exits 0.
- [ ] `MasteryState`, `QuestionType`, and `ScopeKind` are importable as values
      from the generated client, and `MasteryState` has exactly three members
      with no `UNSEEN`.
- [ ] `grep` of `schema.prisma` finds all four `@unique` / `@@unique`
      constraints listed in Requirements, and all five `@@index` declarations.
- [ ] The generated `migration.sql` contains a `CREATE TABLE` for each of the
      eight models and a `CREATE TYPE` for each of the three enums.
- [ ] The generated `migration.sql` contains `CREATE UNIQUE INDEX` statements
      covering `Certification.slug`, `(certificationId, code)`,
      `(examId, number)`, and `(questionId, letter)`.
- [ ] The generated `migration.sql` declares `ON DELETE SET NULL` for the
      `Attempt → DrillRun` foreign key and `ON DELETE CASCADE` for every other
      foreign key.
- [ ] `prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --shadow-database-url <local> --script`
      produces an empty diff — i.e. the committed migration fully reproduces
      the schema. (Requires a local Postgres shadow DB; if none is available
      this criterion is verified by the human running `db:migrate`, and the
      spec's remaining criteria still gate the branch.)
- [ ] `bun run check-format` (repo root) exits 0.
- [ ] `turbo build --filter=nextjs` succeeds (its `prebuild` runs
      `db:generate`, so this proves generation works in a clean build).
- [ ] No file under `prisma/generated/` appears in `git status`.

## Open Questions / Risks

- **The design doc says "Six models" but declares eight.** Its own Prisma block
  lists `Certification`, `Exam`, `Question`, `QuestionOption`,
  `QuestionProgress`, `DrillRun`, `Attempt`, `Bookmark`. The count in the prose
  is stale; the code block is authoritative. Worth correcting in the design doc
  so a later reader does not "discover" two extra models and delete them.
- **Nobody can apply this migration in CI or in an agent worktree.** Neither
  has `DATABASE_URL`. The migration is therefore committed as generated SQL and
  applied by a human running `bun run db:migrate` (or `db:deploy`) locally, per
  the design doc's Human-only work list. The risk is that a hand-generated
  `migration.sql` diverges from what `migrate dev` would have produced —
  mitigated by the `migrate diff --from-migrations` criterion above whenever a
  shadow database is available.
- **`DrillRun.questionIds` has no referential integrity.** Deleting a question
  leaves dangling ids in every historical run. The run-summary screen (#9) must
  tolerate an id that no longer resolves rather than throwing. Flagged here so
  issue #9's plan does not assume every frozen id is live.
- **No index on `Question.topic`.** Topic is a drill scope (`ScopeKind.TOPIC`)
  but only `objective` is indexed. With 413 rows a sequential scan is free, so
  this is deliberately deferred — revisit if the bank grows past a few
  thousand questions.
- **No index on `Attempt.createdAt` alone.** A global "recent activity" feed
  would need one. No screen in the design requires it.
- **`String[]` columns are Postgres-specific.** `correctLetters`,
  `acceptedAnswers`, and `questionIds` all rely on native array columns. This
  ties the schema to Postgres, which is already the case (Neon), but it does
  rule out a SQLite-backed local test database if a test runner is ever added
  (design doc D11).
- **Cuid vs. natural keys.** Every model uses `@default(cuid())` surrogate ids
  except the two 1:1 tables. The seed's idempotency therefore depends entirely
  on the `@@unique` natural keys, not on the ids — if a `@@unique` is dropped,
  issue #3 silently starts duplicating rows instead of failing loudly.
