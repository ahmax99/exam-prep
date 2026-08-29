# Spec: Seed pipeline — JSON → Postgres, with fill-in answer normalization

> Status: Draft · 2026-08-29
> Design of record: [docs/specs/2026-08-29-cert-drill-design.md](./2026-08-29-cert-drill-design.md)
> Backlog issue: **#3** (depends on #2; blocks #4 and #6)

## Problem / Context

413 hand-collected LPIC-1 questions sit in `data/lpic1/{101,102}.json` and are
completely inert — nothing reads them. Issue #2 gives them a place to live;
this issue is the pipeline that gets them there, and the one place where the
hardest data problem in the whole feature is solved.

That problem is fill-in answers. 234 of the 413 questions are fill-ins, and
their `answer` field is free text written for a human: backticks, mixed case,
and — in 64 cases — an `or` or a `/`. Some of those are genuine alternations
(`` `-H or —human` ``) that must become two accepted answers. Most are not:
`` `/etc/passwd` `` contains a slash, and
``"parameters `1` or `S` may be present in the kernel's parameter list"``
contains an `or`. Splitting either one produces garbage that would mark a
correct answer wrong. Decision D3 sizes the stakes: strict grading would fail
roughly a quarter of fill-ins regardless of knowledge, which makes every
mastery number downstream untrustworthy.

The bank itself cannot be committed. `.gitignore` ignores `/data/` because this
is a public repo and the bank is collected exam material — see decision
[D9](./2026-08-29-cert-drill-design.md#d9--the-question-bank-stays-private-agents-get-a-fixture-resolved).
So the pipeline has to work end to end against a small committed fixture, while
the real bank is seeded only by a human on a local machine.

## Goals

- One command turns a question-bank JSON file into rows, and running it twice
  changes nothing the second time.
- Fill-in answers arrive in the database already normalized, so the runtime
  grader compares strings produced by exactly the same code that produced the
  stored ones.
- A genuine alternation becomes multiple accepted answers; a prose answer or a
  path stays one string and falls through to self-grade.
- Agents, CI, worktrees, and any future test can exercise the whole pipeline
  against committed data without the private bank ever entering git.
- Seeding the real 413-question bank is one extra argument away for a human,
  with no code change.

## Non-Goals

- **Committing `data/`.** `.gitignore:46` stays exactly as it is. Nothing in
  this issue may add, unignore, or copy the real bank into tracked files.
- **Running the seed against Neon.** That is
  [human-only work](./2026-08-29-cert-drill-design.md#human-only-work),
  alongside `db:migrate`.
- **Running the seed in CI or in an Amplify build.** The files are not there,
  and the deployed database must never be reseeded by a pipeline.
- **Runtime grading.** `grade.ts` and the answer-submission flow are issue #6.
  This issue ships only the shared normalizer they will import.
- **Writing progress, attempts, runs, or bookmarks.** Absence of a
  `QuestionProgress` row means "unseen"; the seed must preserve that.
- **Editing or correcting the question bank.** Data-quality defects in the
  source JSON are recorded as risks, not fixed here.
- **Importing AWS content.** No AWS data exists.

## Requirements

### Functional

#### The shared normalizer

- `apps/nextjs/src/features/drill/lib/normalizeAnswer.ts` is a **pure module**
  with no imports from Prisma, Next.js, `server-only`, or `node:*`. It must be
  importable both by a standalone Bun script and by runtime server code
  (issue #6's grader). This shared origin is the point: the strings compared at
  answer time must be produced by exactly the code that produced the stored
  `acceptedAnswers`.
- It exports, as named `const` arrow functions:
  - `normalizeAnswer(raw: string): string` — the single-string normalization.
  - `deriveAcceptedAnswers(raw: string): string[]` — normalization plus the
    guarded alternation split; always returns at least one element.
- **Normalization** (`normalizeAnswer`), in order:
  1. Remove all backtick characters.
  2. Lowercase.
  3. Collapse every run of whitespace to a single space and trim. **Whitespace
     here includes U+00A0 (non-breaking space)** — the real bank contains
     `` `/boot/grub/menu.lst`<NBSP>or<NBSP>`/boot/grub/grub.conf` ``, and an
     `\s`-only collapse in some engines would leave the separator unmatchable.
- **Alternation split** (`deriveAcceptedAnswers`), applied to the normalized
  string:
  - Candidate separators are the word `or` delimited by whitespace on both
    sides, and `/` delimited by whitespace on both sides.
  - The split is performed **only when both guards pass**:
    - **Token guard** — the normalized answer is at most **4** whitespace-
      separated tokens.
    - **Code-shape guard** — every resulting side, after trimming, is
      non-empty, contains no whitespace, and contains none of `,` `;` `'` `"`.
  - If either guard fails, the function returns a single-element array holding
    the whole normalized string.
  - A `/` that is not whitespace-delimited is **never** a separator. This is
    what keeps `/etc/passwd`, `/boot/grub/grub.cfg`, and
    `find /usr/bin -perm /6000` intact.
  - Duplicate sides are de-duplicated; order of first appearance is preserved.

> **Why the guards are load-bearing.** 64 of the 234 fill-in answers contain an
> `or` or a `/`, but almost none of them are alternations. The token guard
> alone kills the worst case: ``"parameters `1` or `S` may be present in the
kernel's parameter list"`` normalizes to 11 tokens, so it is never split and
> stays one accepted answer that falls through to self-grade. The
> whitespace-delimited `/` rule kills the second worst case: `` `/etc/passwd` ``
> is a single token that passes the token guard, and an unguarded `/` split
> would shred it into `''`, `etc`, `passwd`. Without both guards the seed
> quietly writes nonsense into `acceptedAnswers`, and the app then marks
> correct answers wrong — the exact failure D3 exists to prevent.

#### The seed script

- `apps/nextjs/prisma/seed.ts` is a standalone Bun script exposed as
  `bun run db:seed`.
- **Path argument, defaulting to the fixture.** With no argument it reads
  `apps/nextjs/prisma/fixtures/sample.json`. With one or more path arguments it
  reads those instead; a directory argument reads every `*.json` directly
  inside it, so a human seeds the real bank with
  `bun run db:seed ../../data/lpic1`. The default is what makes the pipeline
  runnable in an agent worktree, which contains only tracked files and
  therefore never contains `data/`.
- **Input is validated with Zod at the boundary.** The file is read, parsed
  through `catchSyncError` (`JSON.parse` on untrusted-shaped input is exactly
  the recoverable-failure case the helper exists for), then validated against a
  schema covering: `exam` (string), `title` (string), optional `questionCount`
  (int), and `questions[]` with `number`, `exam`, `objective`, `topic`,
  `question`, `explanation`, `type` (`single_answer` | `multiple_answer` |
  `fill_in`), plus type-conditional `options[] {letter, text}` / `correct` /
  `answer`. A validation failure exits non-zero with the Zod issue path — it
  never writes a partial bank.
- **Certification identity.** The bank JSON carries no certification slug,
  name, or vendor (see Open Questions). The schema must accept an optional
  top-level `certification` block (`slug`, `name`, `vendor`); when absent, the
  script falls back to the LPIC-1 constants recorded in the design doc's
  Data model section (`lpic-1` / `LPIC-1: Linux Administrator` / `Linux
Professional Institute`).
- **Field mapping.** `question` → `Question.prompt` (markdown, backticks
  preserved verbatim — normalization applies to answers only, never to the
  prompt or explanation). `type` maps snake_case → the `QuestionType` enum via
  a `Record` lookup, not an `else-if` chain. `correct` becomes
  `correctLetters` (a bare string is wrapped into a one-element array).
- **Fill-in handling.** `acceptedAnswers = deriveAcceptedAnswers(answer)`;
  `answerDisplay = answer` untouched, for rendering as markdown. Non-fill-in
  questions get an empty `acceptedAnswers` and a null `answerDisplay`.
- **Idempotency.** Upsert `Certification` on `slug`, `Exam` on
  `(certificationId, code)`, `Question` on `(examId, number)`, and
  `QuestionOption` on `(questionId, letter)`. Options that exist in the
  database but not in the incoming question are deleted, so an edited bank
  converges rather than accumulating stale rows.
- **The seed writes content only.** It must never insert or update
  `QuestionProgress`, `Attempt`, `DrillRun`, or `Bookmark`. Absence of a
  progress row is the app's definition of "unseen" and the seed must not
  manufacture 413 of them.
- **Summary output.** On success the script prints counts of certifications,
  exams, questions, and options created vs. updated, and the number of fill-ins
  that produced more than one accepted answer — the last figure is how a human
  spots a normalization regression at a glance.

#### The fixture

- `apps/nextjs/prisma/fixtures/sample.json` is committed and matches the same
  schema as the real bank. It must contain, at minimum:
  - at least one `single_answer` question with four options,
  - at least one `multiple_answer` question with two correct letters,
  - the multi-variant fill-in `` `-H or —human` ``,
  - the NBSP-separated alternation
    `` `/boot/grub/menu.lst`<NBSP>or<NBSP>`/boot/grub/grub.conf` ``,
  - a path fill-in containing slashes (e.g. `` `/etc/passwd` ``) that must not
    be split,
  - the prose fill-in
    ``"parameters `1` or `S` may be present in the kernel's parameter list"``,
    which must fall through to self-grade.
- It stays small — roughly 6–10 questions. It is a fixture, not a sample of the
  bank.

#### Wiring

- `apps/nextjs/package.json` gains a `db:seed` script that runs the TypeScript
  file directly through Bun and forwards arguments, so `bun run db:seed <path>`
  works. Prefer invoking `prisma/seed.ts` directly over `prisma db seed`, which
  would require touching `prisma.config.ts` (see Open Questions).

### Constraints

- Named exports only. `const` arrow functions, never `function` declarations.
- `any` is an oxlint **error** — the JSON shape is narrowed by Zod, never cast.
- `noUncheckedIndexedAccess` is on, and `tsconfig.json`'s `include` covers
  `prisma/**/*.ts`, so `bun run check-types` type-checks the seed. Indexing
  into split results and option arrays must handle `undefined`.
- oxfmt: single quotes, no semicolons, 2-space indent, 80 columns, no trailing
  commas; imports auto-sorted.
- Prefer `catchSyncError` / `catchAsyncError` over hand-written `try/catch`,
  per `conventions.md`.
- The seed opens its own Prisma client via `getPrismaClient()` from
  `@/lib/prisma` (path alias `@/*` → `src/*`, which Bun resolves from
  `tsconfig.json`), so it uses the same `DATABASE_URL` resolution as the app.
- No new runtime dependency. Zod, Prisma, and neverthrow are already present.
- Must not modify `.gitignore`, and must not read `data/` by default.
- `normalizeAnswer.ts` must not import `server-only`, or it becomes unusable
  from the standalone script.
- **No unnecessary comments.** Per `.claude/rules/principles.md`, comments
  explain _why_, never _what_ — the code already says what it does. Do not add
  section banners, `// Step 1:` sequences, a line that restates the line below
  it, or JSDoc that repeats a signature the types already carry. A comment
  earns its place only for a non-obvious invariant, a subtle ordering, or a
  decision whose reasoning is invisible in the code, and it stays to one line
  wherever possible. If the _why_ needs a paragraph, the design is too complex
  — simplify it instead of explaining it.

## Affected Areas

- [x] `apps/nextjs/prisma/seed.ts` — new
- [x] `apps/nextjs/prisma/fixtures/sample.json` — new
- [x] `apps/nextjs/src/features/drill/lib/normalizeAnswer.ts` — new (creates
      the `features/drill/` tree)
- [x] `apps/nextjs/package.json` — one added `db:seed` script
- [ ] `apps/nextjs/prisma/schema.prisma` — unchanged (issue #2 owns it)
- [ ] `apps/nextjs/prisma.config.ts` — expected unchanged; see Open Questions
      before touching it
- [ ] `.gitignore` — must not change
- [ ] `data/**` — must not be added to git
- [ ] `infra/**` — must not be touched (G2 #2 blocks unconditionally)

## Acceptance Criteria

**Normalization**

- [ ] `deriveAcceptedAnswers('`-H or —human`')` returns exactly two entries,
      `['-h', '—human']`.
- [ ] ``deriveAcceptedAnswers("parameters `1` or `S` may be present in the
kernel's parameter list")`` returns exactly **one** entry — the answer is
      not split.
- [ ] ``deriveAcceptedAnswers('`/etc/passwd`')`` returns exactly one entry,
      `['/etc/passwd']` — the path is not split on its slashes.
- [ ] ``deriveAcceptedAnswers('`find /usr/bin -perm /6000`')`` returns exactly
      one entry — three tokens passes the token guard, but the non-delimited
      slashes are not separators.
- [ ] The NBSP alternation
      `` `/boot/grub/menu.lst`<NBSP>or<NBSP>`/boot/grub/grub.conf` ``
      returns exactly two entries.
- [ ] `normalizeAnswer('  `Systemctl Isolate` ')` returns
      `'systemctl isolate'` — backticks stripped, lowercased, whitespace
      collapsed, trimmed.
- [ ] `normalizeAnswer` never returns a string containing a backtick, an
      uppercase ASCII letter, a leading/trailing space, or a double space.
- [ ] `deriveAcceptedAnswers` never returns an empty array and never returns an
      empty-string element.

**Seeding**

- [ ] `bun run db:seed` with no arguments reads
      `prisma/fixtures/sample.json` and exits 0.
- [ ] Running `bun run db:seed` twice in a row leaves identical row counts in
      `Certification`, `Exam`, `Question`, and `QuestionOption` — the second
      run creates zero rows (verified by the script's own created/updated
      summary and by a row count before and after).
- [ ] After seeding the fixture, `QuestionProgress`, `Attempt`, `DrillRun`, and
      `Bookmark` all contain **zero** rows.
- [ ] After seeding the fixture, the `` `-H or —human` `` question has
      `acceptedAnswers` of length 2 and a non-null `answerDisplay` equal to the
      original string including its backticks.
- [ ] After seeding the fixture, the prose fill-in has `acceptedAnswers` of
      length 1.
- [ ] Every seeded `single_answer` question has a `correctLetters` array of
      length 1; every `multiple_answer` question has length ≥ 2.
- [ ] Every seeded question's `prompt` still contains its original backticks —
      normalization did not leak onto prompts or explanations.
- [ ] Editing the fixture to remove one option from a question and reseeding
      leaves that question with one fewer `QuestionOption` row, not a stale
      orphan.
- [ ] Pointing the seed at a JSON file whose `questions[0].type` is
      `"true_false"` exits non-zero and prints the failing Zod issue path,
      writing no rows.
- [ ] `bun run db:seed <nonexistent-path>` exits non-zero with a readable
      message and no stack trace dump of internal frames.

**Repo hygiene / gates**

- [ ] `git diff --stat` lists exactly four files: `prisma/seed.ts`,
      `prisma/fixtures/sample.json`, `src/features/drill/lib/normalizeAnswer.ts`,
      `package.json`.
- [ ] `git check-ignore data/lpic1/101.json` still succeeds — the bank remains
      ignored, and `git status` shows nothing under `data/`.
- [ ] `bun run check-types` (repo root) exits 0.
- [ ] `bun run check-format` (repo root) exits 0 — `normalizeAnswer.ts` and
      `seed.ts` contain no semicolons, use single quotes, and stay within 80
      columns.
- [ ] `grep -c 'export const' src/features/drill/lib/normalizeAnswer.ts`
      returns 2, and the file contains no `export default` and no `function `
      declaration.
- [ ] `grep -n ': any' ` over the three new source files returns nothing.
- [ ] `normalizeAnswer.ts` imports nothing from `@prisma/client`, `next`,
      `server-only`, or `node:*`.
- [ ] `turbo build --filter=nextjs` succeeds.

## Open Questions / Risks

- **The bank JSON has no certification identity.** Each file carries only
  `exam`, `title`, `questionCount`, and `questions[]` — there is no slug, name,
  or vendor for the certification the exam belongs to, yet the schema requires
  all three. This spec resolves it with an optional `certification` block plus
  an LPIC-1 fallback constant, but that means the fallback is a hardcoded
  literal in the seed script. When the AWS bank arrives, its JSON must carry the
  block explicitly rather than growing a second hardcoded branch.
- **Prisma 7 puts seed configuration in `prisma.config.ts`, not
  `package.json`.** The design doc's backlog names `package.json` as the file
  this issue touches, which is correct for a plain `db:seed` script. But
  `prisma migrate reset` will **not** auto-seed unless
  `migrations.seed` is set in `prisma.config.ts`. This spec deliberately keeps
  scope to `package.json` and accepts that `db:reset` leaves an empty database
  requiring a manual `db:seed`. If auto-seed on reset is wanted, add
  `prisma.config.ts` to the plan's file list explicitly — otherwise the anomaly
  gate (G2 #3) will block the branch for scope drift.
- **Fixture content — resolved: rewrite, don't copy.** D9 keeps `data/` out of
  git because the bank is collected exam material, so a fixture drawn verbatim
  would publish exactly what that ignore protects. The fixture's questions are
  therefore **authored fresh**, chosen to reproduce every _shape_ the
  normalizer must handle rather than any specific source question: the `or`
  alternation, the non-breaking-space separator, a bare path answer, a
  multi-token command, and a prose answer long enough to fall through to
  self-grade. Keep the count low. Do not paste from `data/lpic1/`.
- **The `or` split is case- and language-blind.** After lowercasing, a
  four-token answer that happens to contain the English word "or" as content
  rather than as a separator would still split. Nothing in the current 234
  fill-ins hits this, but the split rule is a heuristic, not a parser — the
  self-grade fallback (D3) is what makes a heuristic acceptable here.
- **Data-quality defects in the source bank are out of scope but real.** The
  `-H or —human` answer uses an em dash where the actual flag is `--human`;
  several answers contain curly quotes (`”`) copied from a rendered page. These
  will produce accepted answers a user can never type. The self-grade path
  covers it, but a bank-cleanup pass is worth its own issue.
- **No test runner — decided, and this issue does not add one** (design doc
  **D11**). Every normalization criterion above is a pure-function assertion,
  precisely the case a runner exists for, and they are instead verified by a
  throwaway script or a REPL that leaves nothing behind. **Do not add a test
  file or a test dependency to this issue** — it would put the branch outside
  its declared file set and trip anomaly gate G2 #3.
  The residual risk is explicit and accepted: once the real bank is seeded,
  editing `normalizeAnswer.ts` silently invalidates every stored
  `acceptedAnswers`, and no check will fail. Treat that file as frozen after
  the first real seed; re-seed if it must change.
- **`String[]` de-duplication is not enforced by the database.**
  `acceptedAnswers` uniqueness is a property of `deriveAcceptedAnswers`, not a
  constraint. A regression there produces duplicates the schema will happily
  store.
