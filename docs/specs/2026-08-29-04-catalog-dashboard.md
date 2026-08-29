# Spec: Catalog read layer + dashboard page

> Status: Draft · 2026-08-29
> Design of record: [docs/specs/2026-08-29-cert-drill-design.md](./2026-08-29-cert-drill-design.md)
> Backlog issue **#4** — depends on **#2** (schema + migration) and **#3** (seed pipeline).

## Problem / Context

After issues #2 and #3 the 413-question bank lives in Postgres, but nothing
reads it: `/` is still the boilerplate `HeroSection`. The whole point of the
app is answering **"what do I study next?"** before anything else, and today
that question has no surface at all — there is no way to see how many
questions are mastered, missed, or never seen, and no way to find the
objectives that are actually weak.

This issue builds the first read path end to end: a `catalog` feature that
reads the content tree, a `progress` feature that rolls per-question mastery
up to per-certification and per-objective figures in SQL, and the dashboard
screen (Screen 01 of the reference mockup) that renders both as a Server
Component.

## Goals

- Opening `/` shows, above the fold, which objectives are weakest and links
  straight into a drill scoped to each one.
- Per-certification standing is legible at a glance: mastered / missed /
  unseen counts plus one mastery percentage.
- Mastery rollups are computed by the database (`GROUP BY`), so they stay
  correct and cheap at 413 questions and at 4,000.
- The catalog read layer is the single server-side entry point to the content
  tree, reusable by issue #5's certification page without change.
- The app shell (desktop rail / phone bottom tab bar) exists and is usable
  one-handed on a phone, in the same change that first needs it.

## Non-Goals

- **Starting or running a drill.** The drill engine is issue #6 and the drill
  UI is issue #7. This issue emits links only; their destination does not
  exist yet.
- **The certification page `/[cert]`** — issue #5. Certification cards link to
  it, but the route is not created here.
- **Doughnut charts.** Issue #5 owns every chart; the dashboard uses bars.
- **Bookmarks** (issue #10) and **run history** (issue #9). Rail entries for
  them render a placeholder count, not a query.
- **New Prisma models, migrations, or seed changes.** The schema is frozen as
  issues #2/#3 left it.
- **Light mode**, authentication, and any client-side data fetching.

## Requirements

### Functional

**Catalog read layer — `src/features/catalog/server/api/`**

- `getCertifications()` returns every certification as `{ id, slug, name,
vendor, examCount, questionCount }`, ordered by `name` ascending. A
  certification with zero exams or zero questions is included with `0`, never
  omitted.
- `getCertification(slug)` returns one certification plus its exams as
  `{ code, title, questionCount, topicCount, objectiveCount }`, exams ordered
  by `code` ascending. It throws `AppError('NOT_FOUND', …)` when no
  certification has that slug.
- Both are server-only (`import 'server-only'`) and open with
  `const db = await getPrismaClient()`.

**Progress rollups — `src/features/progress/server/api/`**

- `getDashboard()` returns, per certification, the four mutually exclusive
  buckets `mastered` / `shaky` / `missed` / `unseen` plus `total` and
  `masteryPercent`, where:
  - `mastered` = questions whose `QuestionProgress.state` is `MASTERED`
  - `shaky` = state `SHAKY`
  - `missed` = state `WRONG`
  - `unseen` = questions with **no** `QuestionProgress` row
  - `masteryPercent` = `mastered ÷ total`, rounded to a whole number, `0` when
    `total` is `0` (never `NaN`, never a division-by-zero throw)
  - the four buckets sum to `total` for every certification
- `getWeakestObjectives(certSlug, limit)` returns
  `{ objective, topic, mastered, total, masteryPercent }` per objective,
  sorted by `masteryPercent` ascending, ties broken by `total` descending then
  `objective` ascending, limited to `limit` (default `5`). Objectives with no
  questions cannot appear (they do not exist as rows). An objective nobody has
  answered yet is `0%` and therefore sorts to the top.
- Both rollups are computed with SQL aggregation — Prisma `groupBy` (or a
  typed `$queryRaw`), **not** by loading question rows and reducing them in
  TypeScript.

**Dashboard page — `/`**

- Renders as a **Server Component**. No `'use client'`, no browser `fetch` of
  its own API, no Prisma client reaching the browser bundle.
- Certification card per certification: name, vendor, mastery percentage as a
  large mono figure, a segmented mastery bar (mastered + shaky share), and the
  `mastered / missed / unseen` counts. The whole card links to `/{slug}`.
- A certification with `total === 0` renders a muted "No questions imported
  yet" card with `—` instead of a percentage, and does not link anywhere.
- "Weakest objectives" panel below the cards: one row per objective showing
  the objective code (mono), its topic name, an accuracy bar, and the
  percentage. Each row is a `next/link` to
  `/{certSlug}/drill?scopeKind=OBJECTIVE&scopeValue={objective}` — the drill
  entry route issue #6/#7 implements.
- Empty states, not crashes: zero certifications seeded → an empty state
  telling the reader to run `db:seed`; a certification with zero attempts →
  the weakest-objectives panel says every objective is untouched and offers a
  "Start drilling" link scoped to the certification.
- The page reads live progress on every request, so it opts into dynamic
  rendering with `export const dynamic = 'force-dynamic'`.

**App shell + responsiveness**

- A left rail (Certifications with question counts; Practice: Missed / Never
  seen / Bookmarked / Past runs) is visible at `lg` and above.
- Below `md` the rail is hidden and replaced by a fixed 4-item bottom tab bar
  — **Study / Saved / Runs / Stats** — with safe-area inset padding, and the
  page's primary action pins to the thumb zone above it.
- Every tap target is at least 44×44 px; the page must not scroll
  horizontally at a 320 px viewport.
- Rail counts that depend on features not yet built (Bookmarked, Past runs)
  render `—`, not a fabricated number.

### Constraints

- Feature-folder placement per `.claude/rules/architecture.md`: server logic
  in `features/<name>/server/api/`, page-specific server components in
  `features/<name>/server/components/`, cross-feature UI in
  `src/components/{atoms,molecules,layout}` with `data-slot` and CVA where a
  variant system is genuinely needed.
- `server/api` code starts with `const db = await getPrismaClient()` from
  `@/lib/prisma`. There is no model layer and no ORM wrapper.
- Server Components call `server/api` through `catchAsyncError(...)` and handle
  the `Result` with `.match(...)` / `.unwrapOr(...)`; the error branch renders
  an error state rather than letting a stack trace escape.
- Zod validation is for external input only. Nothing on this page takes
  external input, so **no new schemas are added** by this issue.
- Named exports only, except the Next.js-required default export for
  `page.tsx` / `layout.tsx`. `const` arrow functions, never `function`
  declarations (Next.js page defaults may use whichever form the existing
  `page.tsx` already uses).
- `any` is an oxlint **error** — derive types from Prisma's generated client
  or declare explicit result types.
- Cache Components is **off**: `'use cache'`, `cacheLife`, and `cacheTag` are
  unavailable. Use route segment config (`dynamic`), and `unstable_cache` with
  a `tags` array only if caching is added later.
- Dark-only. Every colour comes from a token in `src/styles/tokens/`
  (including `--success` from issue #1); no hex literal may appear in a
  component file. All figures render in Geist Mono.
- No `NEXT_PUBLIC_*` variables; no absolute base URLs.
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
this list — the plan must name these paths and only these.

- [x] `apps/nextjs` — new `catalog` and `progress` features, the dashboard
      route, and the app shell
  - `src/features/catalog/server/api/getCertifications.ts` (new)
  - `src/features/catalog/server/api/getCertification.ts` (new)
  - `src/features/catalog/server/api/index.ts` (new — re-exports)
  - `src/features/progress/server/api/getDashboard.ts` (new)
  - `src/features/progress/server/api/getWeakestObjectives.ts` (new)
  - `src/features/progress/server/api/index.ts` (new — re-exports)
  - `src/features/progress/constants/index.ts` (new — `WEAKEST_OBJECTIVES_LIMIT`)
  - `src/features/progress/server/components/CertificationCard.tsx` (new)
  - `src/features/progress/server/components/WeakestObjectivesPanel.tsx` (new)
  - `src/components/atoms/MasteryBar.tsx` (new — segmented mastered/shaky bar)
  - `src/components/atoms/index.ts` (modified — export `MasteryBar`)
  - `src/components/layout/AppRail.tsx` (new — desktop rail)
  - `src/components/layout/BottomTabBar.tsx` (new — phone tab bar)
  - `src/components/layout/index.ts` (modified — export both)
  - `src/app/(public)/layout.tsx` (new — app shell: `ErrorScreenProvider`,
    rail, bottom tab bar, wrapping every `(public)` route so issue #5's
    `/[cert]` inherits it)
  - `src/app/(public)/(main)/layout.tsx` (modified — reduced to the parts the
    shell does not own, or removed if it becomes an empty pass-through)
  - `src/app/(public)/(main)/page.tsx` (rewritten — the dashboard)
  - `src/components/common/HeroSection.tsx`,
    `src/components/common/index.ts` (removed — the boilerplate hero the
    dashboard replaces; leaving it makes it dead code that `fallow` flags)
- [ ] `apps/nextjs/prisma` — **not touched.** No schema or migration change.
- [ ] `infra/`, `.github/` — **not touched.**

## Acceptance Criteria

- [ ] `getCertifications()` returns an **empty array**, not an error, when the
      `Certification` table is empty.
- [ ] `getCertification('lpic-1')` returns the certification with its exams
      ordered `101`, `102`, each carrying `questionCount` `198` and `215`
      against the real bank.
- [ ] `getCertification('does-not-exist')` rejects with an `AppError` whose
      code is `NOT_FOUND` (status `404`), not `undefined` or a Prisma error.
- [ ] For every certification returned by `getDashboard()`,
      `mastered + shaky + missed + unseen === total`.
- [ ] `getDashboard()` reports `masteryPercent: 0` (not `NaN`) for a
      certification that has zero questions and for one with zero
      `QuestionProgress` rows.
- [ ] A question with **no** `QuestionProgress` row counts once in `unseen` and
      in no other bucket; deleting its progress row moves it back to `unseen`.
- [ ] `getWeakestObjectives('lpic-1')` returns at most
      `WEAKEST_OBJECTIVES_LIMIT` rows, sorted strictly non-decreasing by
      `masteryPercent`, and every row's `mastered <= total`.
- [ ] `getWeakestObjectives` returns an empty array — not a throw — for a
      certification slug that exists but has no questions.
- [ ] The whole dashboard render issues a bounded number of SQL statements
      that does not grow with question count: with Prisma query logging on, a
      dashboard request emits **≤ 6 statements** against the 413-question bank
      and the same number against a 40-question fixture.
- [ ] `grep -rn "'use client'" src/features/catalog src/features/progress`
      returns nothing, and both `server/api` directories' files start with
      `import 'server-only'`.
- [ ] `grep -rnE "#[0-9a-fA-F]{3,8}\b"` over the files this issue adds under
      `src/components` and `src/features` returns nothing (colours come from
      tokens).
- [ ] Viewing source of `/` in a browser shows the mastery figures already in
      the server-rendered HTML (they are present with JavaScript disabled).
- [ ] Every weakest-objective row is an `<a>` whose `href` is
      `/lpic-1/drill?scopeKind=OBJECTIVE&scopeValue=<objective code>`, and
      every certification card with `total > 0` links to `/<slug>`.
- [ ] At a 1280 px viewport the rail is visible and the bottom tab bar is
      absent; at 375 px the rail is absent and a 4-item bottom tab bar
      (Study / Saved / Runs / Stats) is fixed to the bottom of the viewport
      (verified with the `playwright` plugin).
- [ ] At a 320 px viewport, `document.documentElement.scrollWidth <=
window.innerWidth` — the page does not scroll horizontally.
- [ ] With the `Certification` table empty, `/` renders an empty state
      containing seed instructions and returns HTTP 200 (not 500).
- [ ] `bun run check-types` and `bun run check-format` pass, and
      `bunx react-doctor@latest --verbose --scope changed` reports no new
      errors.

## Open Questions / Risks

- **The drill entry route does not exist in the design doc's route table.**
  The table lists `/[cert]/drill/[runId]`, which needs a run id that only
  `POST /api/drill/runs` can mint — a link cannot create one. This spec
  standardises on `/{certSlug}/drill?scopeKind=…&scopeValue=…` as the entry
  route that issue #7 must implement (start a run, redirect to its `[runId]`).
  Until #6/#7 ship, these links 404; the acceptance criteria grade the `href`
  value, not the destination.
- **`SHAKY` has no place on the card.** The mockup's card shows only
  mastered / missed / unseen while the schema has four buckets, so `shaky` is
  returned by `getDashboard()` and rendered as the second bar segment but is
  not given its own count. If the number matters more than the shape, that is
  a follow-up, not a redesign.
- **The reference mockup's own numbers do not add up** (266 + 38 + 147 = 451
  against a stated 413). Treat the mock as layout, never as fixtures.
- **Rail counts for Bookmarked / Past runs** stay `—` until issues #9 and #10;
  a later issue must wire them rather than this one guessing.
- **Moving the shell into `(public)/layout.tsx`** changes where
  `ErrorScreenProvider` and the page header live for the existing route. It is
  the smallest way to give issue #5's `/[cert]` the same chrome without
  duplicating it, but it does touch a file the backlog table did not name —
  hence its explicit listing under Affected Areas.
- **No test runner** (design doc D11 — decided, none is added). Verification is the type-checker, a
  manual `/` render against a seeded local database, and Playwright for the
  responsive criteria.
