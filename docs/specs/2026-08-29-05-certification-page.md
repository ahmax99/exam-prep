# Spec: Certification page — exams, topic mastery, doughnut charts

> Status: Draft · 2026-08-29
> Design of record: [docs/specs/2026-08-29-cert-drill-design.md](./2026-08-29-cert-drill-design.md)
> Backlog issue **#5** — depends on **#4** (catalog read layer + dashboard), **#11** (dark mode root).

## Problem / Context

The dashboard from issue #4 links every certification card to `/{slug}`, and
that route does not exist. It is also the level the original sketch skipped:
LPIC-1 is not one flat pile of 413 questions — it splits into exam **101**
(198 questions across 4 topics) and exam **102** (215 questions across 6
topics), and each topic is where a study session actually starts.

This issue builds `/[cert]`: the cert → exam → topic hierarchy, a per-topic
mastery list, and the two doughnut charts of Screen 02. Both doughnuts are
genuine part-to-whole splits — "question mix" (how the bank is composed) and
"last 7 days" (how recent answers landed) — so the reader can tell what kind
of questions are coming and whether the last week went well, on the same
screen where they choose what to drill.

## Goals

- Every level of the hierarchy — exam, topic — is a one-click drill scope.
- The composition of an exam is visible before drilling it, so 143 fill-ins
  out of 198 is not a surprise discovered mid-run.
- Recent effort is visible as an honest outcome split, with self-graded
  answers shown as their own category rather than folded into "correct".
- Charts are hand-rolled SVG: no charting library enters the bundle for two
  doughnuts.
- The chart palette lives in the theme (issue #1) and is consumed as tokens,
  so a colour is corrected in one file and not in five components.

## Non-Goals

- **Any write path.** No drill run is started, no answer is graded, nothing is
  bookmarked. Every interactive element on this page is a link.
- **A per-exam route `/[cert]/[exam]`.** Exam selection is a search param on
  this page; a dedicated route is not in the design's route table.
- **The bookmarks shelf** (`/[cert]/bookmarks`, issue #10) and the **drill and
  summary routes** (issues #7 and #9), even though this page links toward the
  drill entry route.
- **New Prisma models or migrations**, and any change to the seed pipeline.
- **A charting library**, a chart abstraction beyond one reusable doughnut
  molecule, and light mode.

## Requirements

### Functional

**Route `/[cert]`**

- A Server Component page at `src/app/(public)/[cert]/page.tsx` reading
  `params.cert` as the certification slug. An unknown slug renders Next.js's
  `notFound()` (HTTP 404), not a 500.
- Optional `?exam=<code>` search param selects which exam the charts and the
  topic list describe. Absent or unknown → the first exam by `code` ascending.
- `generateMetadata` produces a per-certification title via the existing
  `generatePageMetadata` helper.
- Reads live progress, so `export const dynamic = 'force-dynamic'`.
- Inherits the app shell (rail + phone bottom tab bar) created in issue #4;
  the rail's Exams group lists this certification's exams with their question
  counts and marks the selected one.

**Hierarchy and drill links**

- Header: exam title and a summary line — `198 questions across 4 topics · 23
objectives` — plus a primary action `Drill all 198 →`.
- Exam list: every exam of the certification with its code, title and question
  count; each row links to
  `/{certSlug}/drill?scopeKind=EXAM&scopeValue={examCode}`.
- Topics panel for the selected exam: one row per topic showing topic code and
  name, a segmented mastery bar (mastered + shaky), and `mastered/total` as a
  mono figure. Each row links to
  `/{certSlug}/drill?scopeKind=TOPIC&scopeValue={topic}`.
- Topic rows are ordered by topic code ascending; a topic with zero mastered
  questions renders `0/N`, not a blank.

**Doughnut charts**

- Both charts are **inline SVG** built from `<circle>` arcs
  (`stroke-dasharray` / `stroke-dashoffset`). No chart library dependency is
  added to `package.json`.
- Each chart's centre figure is the **sum of its own segments** — the
  component derives it rather than accepting a separate total, so the centre
  and the arcs cannot disagree.
- Chart A — **"Question mix"**, scoped to the selected exam: fill-in / single
  answer / multiple answer, counted by `Question.type`, using the chart tokens
  whose validated values are `#a57218` (fill-in), `#4a8df5` (single answer),
  `#a258c1` (multiple answer). Centre label: the exam's question count over
  `QUESTIONS`.
- Chart B — **"Last 7 days — how N answers landed"**, scoped to the
  certification: right first try / self-graded as known / missed, using the
  chart tokens whose validated values are `#24a969`, `#a57218`, `#b02a2f`.
  Buckets are derived from `Attempt` rows created in the last 7 days:
  - right first try = `isCorrect && !selfGraded`
  - self-graded as known = `isCorrect && selfGraded`
  - missed = `!isCorrect`
- **Every segment carries a direct, visible label with its count** — a legend
  row adjacent to the ring giving swatch, name, count and percentage. Exam 101
  has only **2** multiple-answer questions; that arc is roughly 1% and
  effectively invisible, so the count must be readable without hovering. A
  `<title>` inside each arc for the hover tooltip is additional, never the only
  label.
- Each chart's root `<svg>` carries `role="img"` and an `aria-label` naming
  every segment with its count and the total, e.g. `Question mix: 143 fill in
the blank, 53 single answer, 2 multiple answer, of 198 total`.
- A chart whose total is `0` (no attempts in the last 7 days) renders the
  muted track ring, a `0` centre figure, and an explicit "No answers in the
  last 7 days" message — never a blank box or a division-by-zero.

**Data access**

- Question-mix counts come from a SQL aggregation over `Question.type`
  (`groupBy`), topic mastery from a `GROUP BY topic` over questions joined to
  `QuestionProgress`, and the outcome split from a `GROUP BY` over `Attempt` —
  none of them by loading rows and reducing them in TypeScript.

### Constraints

- The chart colours **must be consumed as CSS custom properties from the theme
  added in issue #1** (`src/styles/tokens/colors.css`). The hex values quoted
  above are the validated OKLCH-band steps recorded in the design doc; they
  document what the tokens must equal. No component file added by this issue
  may contain a hex colour literal.
- Placement per `.claude/rules/architecture.md`: the reusable doughnut is a
  **molecule** in `src/components/molecules/` (composed of atoms, `data-slot`,
  named exports from one file); page-specific server components live in
  `features/catalog/server/components/`; progress rollups live in
  `features/progress/server/api/`.
- `server/api` code starts with `const db = await getPrismaClient()`; Server
  Components consume it through `catchAsyncError(...)` and `.match(...)`.
- The `?exam=` search param is external input and is therefore validated with
  a Zod schema at the page boundary
  (`features/catalog/schemas/certPageParams.schema.ts`); an invalid value
  falls back to the default exam rather than throwing.
- Named exports only, except the Next.js-required default for `page.tsx`;
  `const` arrow functions; `any` is an oxlint error.
- Cache Components is off — `'use cache'`, `cacheLife`, `cacheTag` are
  unavailable. Use route segment config; `unstable_cache` with `tags` only if
  caching is introduced.
- Dark-only, Geist Mono for every figure and code, responsive as a
  requirement: below `md` the two charts stack in one column, legends stay
  under their ring, topic rows stay tappable at ≥44 px, and the primary
  "Drill all" action pins above the bottom tab bar.
- **No unnecessary comments.** Per `.claude/rules/principles.md`, comments
  explain _why_, never _what_ — the code already says what it does. Do not add
  section banners, `// Step 1:` sequences, a line that restates the line below
  it, or JSDoc that repeats a signature the types already carry. A comment
  earns its place only for a non-obvious invariant, a subtle ordering, or a
  decision whose reasoning is invisible in the code, and it stays to one line
  wherever possible. If the _why_ needs a paragraph, the design is too complex
  — simplify it instead of explaining it.

## Affected Areas

The `backlog-runner` anomaly gate (G2 #3) blocks a diff that strays outside
this list.

- [x] `apps/nextjs` — the `/[cert]` route, catalog reads, chart molecule
  - `src/app/(public)/[cert]/page.tsx` (new — the certification page)
  - `src/features/catalog/server/api/getExam.ts` (new —
    `getExam(certSlug, code)` with its topics and per-topic question counts)
  - `src/features/catalog/server/api/getQuestionMix.ts` (new — counts by
    `Question.type` for one exam)
  - `src/features/catalog/server/api/index.ts` (modified — re-export both)
  - `src/features/catalog/schemas/certPageParams.schema.ts` (new — `?exam=`)
  - `src/features/catalog/server/components/ExamList.tsx` (new)
  - `src/features/catalog/server/components/TopicMasteryPanel.tsx` (new)
  - `src/features/progress/server/api/getTopicMastery.ts` (new —
    `getTopicMastery(certSlug, examCode)`)
  - `src/features/progress/server/api/getRecentOutcomes.ts` (new —
    `getRecentOutcomes(certSlug, days)`)
  - `src/features/progress/server/api/index.ts` (modified — re-export both)
  - `src/components/molecules/DoughnutChart.tsx` (new — SVG doughnut +
    `DoughnutLegend`, both named exports from this one file)
  - `src/components/molecules/index.ts` (modified — export the chart)
- [ ] `apps/nextjs/prisma` — **not touched.**
- [ ] `src/styles/tokens/colors.css` — **not touched here**; the chart tokens
      are issue #1's deliverable and are consumed, not defined, by this issue.
- [ ] `infra/`, `.github/` — **not touched.**

> The backlog table lists issue #5 as touching `features/catalog/**`,
> `app/(public)/[cert]/**` and `components/molecules/**` only. Topic mastery
> and the last-7-days split are progress reads by definition, so two files
> under `features/progress/server/api/` are named above deliberately — the
> plan must carry them or the anomaly gate will fire on a legitimate diff.

## Acceptance Criteria

- [ ] `GET /lpic-1` returns HTTP 200 and its server-rendered HTML contains the
      exam codes `101` and `102` with question counts `198` and `215`.
- [ ] `GET /not-a-cert` returns HTTP 404 (Next.js `notFound()`), not 500.
- [ ] `GET /lpic-1?exam=102` renders exam 102's topic list and question mix;
      `GET /lpic-1?exam=999` and `GET /lpic-1?exam=<script>` both fall back to
      exam `101` and still return 200.
- [ ] For the question-mix chart on exam 101, the three segment counts sum to
      the centre figure `198`, and the multiple-answer segment shows the
      literal count `2` as visible text in the legend (asserted from the DOM,
      not from a `title` attribute).
- [ ] Every doughnut `<svg>` has `role="img"` and a non-empty `aria-label` that
      names each segment with its count and states the total.
- [ ] `DoughnutChart` derives its centre figure from the sum of the segments it
      is given — its props expose no way to pass a total that disagrees with
      the segments (verified by reading the exported prop type).
- [ ] With zero `Attempt` rows in the last 7 days, the "Last 7 days" panel
      renders a `0` centre figure plus an explicit no-answers message and the
      page still returns 200.
- [ ] Topic rows on exam 101 sum their `total` values to `198`, and each row's
      `mastered <= total`.
- [ ] Every exam row is an `<a>` with
      `href="/lpic-1/drill?scopeKind=EXAM&scopeValue=101"` (and `102`), and
      every topic row is an `<a>` with
      `href="/lpic-1/drill?scopeKind=TOPIC&scopeValue=<topic>"`.
- [ ] `grep -rnE "#[0-9a-fA-F]{3,8}\b"` over the files this issue adds returns
      nothing; every chart fill is a `var(--…)` token reference.
- [ ] `git diff apps/nextjs/package.json` is empty — no charting dependency
      was added — and no import of a chart library appears in the diff.
- [ ] `grep -rn "'use client'"` over the files this issue adds returns nothing.
- [ ] The whole `/lpic-1` render issues a bounded number of SQL statements
      independent of question count: **≤ 8 statements** with Prisma query
      logging enabled, unchanged between the 413-question bank and a small
      fixture.
- [ ] At 375 px the two chart panels stack vertically, each legend sits under
      its own ring, and the page does not scroll horizontally
      (`scrollWidth <= innerWidth`) — verified with the `playwright` plugin.
- [ ] `bun run check-types` and `bun run check-format` pass, and
      `bunx react-doctor@latest --verbose --scope changed` reports no new
      errors.

## Open Questions / Risks

- **Issue #1's token names are not yet fixed.** This spec pins the _values_
  (`#a57218`, `#4a8df5`, `#a258c1`, `#24a969`, `#b02a2f`) and the rule that
  they are consumed as tokens; the plan must read the names issue #1 actually
  shipped (the mockup calls them `--c-1/--c-2/--c-3` and
  `--c-ok/--c-warn/--c-bad`) before writing components against them. If issue
  #1 has not landed, this issue is blocked, not free to invent tokens.
- **`--card` disagrees between the design doc and the code.** The design doc
  and mockup describe the dark card as `#0a0a0a`; `src/styles/tokens/
colors.css` currently ships `#090909`. The chart steps were contrast-validated
  against `#0a0a0a`. The difference is imperceptible, but someone should
  decide which is canonical rather than letting the two drift.
- **"Right first try" is a label, not a guarantee.** The bucket is per
  `Attempt` (`isCorrect && !selfGraded`), so a question answered correctly on
  a second run counts as a right answer that day. Renaming it to "Right
  without self-grade" is a copy decision, not a data change.
- **Exam scoping of chart B.** Chart A is per exam, chart B is per
  certification (recent effort spans both exams). If the two panels sitting
  side by side at different scopes reads as inconsistent, scoping B to the
  selected exam is a one-line change to `getRecentOutcomes`.
- **`scopeValue` encoding — settled, and this note was wrong.** An earlier
  draft of this spec claimed issue #6 canonicalises `DrillRun.scopeValue` as
  `"<certSlug>:<value>"`. It does not: `#06` takes
  `{ scopeKind, scopeValue, certSlug }` with `scopeValue` holding the **bare**
  value (`101`, a topic name, an objective code) and the empty string for
  `CERT` / `MISSED` / `UNSEEN` / `BOOKMARKS`, where `scopeKind` + `certSlug`
  already describe the scope fully. The bare links this page emits are correct
  as written.
- **No test runner** (design doc D11 — decided, none is added): verification is the type-checker,
  Playwright for the rendered assertions, and a manual read of the SQL
  statement log.
