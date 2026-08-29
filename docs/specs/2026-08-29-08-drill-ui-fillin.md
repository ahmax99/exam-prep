# Spec: Drill UI — fill-in field, no-match verdict, self-grade

> Status: Draft · 2026-08-29
> Design of record: [docs/specs/2026-08-29-cert-drill-design.md](./2026-08-29-cert-drill-design.md)
> Backlog issue: **#8** · Depends on: **#6** (drill engine), **#7** (drill UI shell) · Touches: `features/drill/client/**`
> Visual reference: screen **05** of the mockup —
> <https://claude.ai/code/artifact/847f0428-275e-4248-b543-1879f3268357>

## Problem / Context

Fill-in is not an edge case in this bank — it is **the majority case**: 234 of
413 questions (57%) are `FILL_IN`. Issue #7 built the drill shell for choice
questions and left the fill-in branch as a placeholder. This issue is the one
that makes the drill usable at all.

Decision **D3** settled the grading model: hybrid. About 76% of fill-in answers
are ≤4 tokens and can be matched against `acceptedAnswers`; the remaining
quarter are prose that no string comparison can grade fairly. Strict
auto-grading would mark the user wrong on a quarter of the largest slice of the
bank regardless of what they actually knew, and the mastery numbers this whole
app exists to produce would be worthless.

That is why the third verdict — **no-match** — is a first-class state with its
own colour, and why it is **amber, never red**. "Your string didn't match the
stored variants" and "you didn't know it" are different facts. Rendering them
identically teaches the user to distrust every number on the dashboard.

## Goals

- Type a free-text answer to a `FILL_IN` question and get an immediate verdict.
- Distinguish, visibly and unambiguously, a wrong answer from an answer the
  grader simply could not match.
- Resolve a no-match in one keystroke, honestly, by self-grading — and have
  that self-grade recorded as such rather than silently folded into the
  auto-graded numbers.
- Keep the same keyboard-first, one-handed, no-navigation drill experience
  issue #7 established.

## Non-Goals

- **Choice questions.** `SINGLE_ANSWER` / `MULTIPLE_ANSWER` rendering, the
  answered state and the explanation panel are issue #7's and are reused, not
  rebuilt.
- **Grading logic.** `grade.ts`, `normalizeAnswer.ts`, the answers endpoint and
  the self-grade endpoint all belong to issue #6. This issue calls them.
- **Answer normalization at answer time.** Normalization is a seed-time and
  server-side concern (design doc, Seed pipeline). The client sends the raw
  typed string; it never normalizes or pre-matches.
- **Editing an answer after submit**, or re-grading a self-graded question
  within the same run.
- **Run summary / retry.** Issue #9.
- **Bookmark persistence.** Issue #10 (the meta row placeholder from #7 stands).
- **Light mode.**

## Requirements

### Functional

**The input**

- A `FILL_IN` question renders a single-line free-text input beneath the prompt,
  in **monospace** — the answers are commands, paths, flags and filenames, and
  the input must look like the terminal it is asking about.
- The input is autofocused when the question mounts, with `autocomplete`,
  `autocorrect`, `autocapitalize` and spellcheck all off — an autocapitalized
  first letter would silently corrupt a case-sensitive command name on a phone.
- Submit is disabled while the input is empty or whitespace-only.
- Submitting sends the **raw** typed string to
  `POST /api/drill/runs/[runId]/answers`.

**The three verdicts**

The endpoint returns exactly one of three verdicts, and each has a distinct
rendered state:

| Verdict    | Meaning                                      | Treatment             |
| ---------- | -------------------------------------------- | --------------------- |
| `matched`  | the typed string matched an accepted variant | **success** (green)   |
| `no-match` | matched nothing; the grader cannot judge     | **amber** — never red |
| `wrong`    | explicitly graded incorrect by the server    | **destructive** (red) |

- **`matched`** — the field is marked correct, the explanation panel from issue
  #7 appears, and the primary action becomes "Next question".
- **`no-match`** — the field is marked amber. The panel reveals the question's
  `answerDisplay` (the untouched original answer, rendered through issue #7's
  inline-code renderer) **plus** the explanation, and offers the self-grade
  choice below. No attempt outcome has been decided yet at this point.
- **`wrong`** — the field is marked with the destructive treatment, the correct
  answer and the explanation are shown, and the primary action becomes
  "Next question". No self-grade is offered.
- Each state carries a text label as well as a colour ("Matched",
  "No match — did you have it?", "Incorrect"), so it is readable without colour
  perception and assertable from an accessibility snapshot.

**The self-grade panel** (no-match only)

- Exactly **two** actions, no more: **"I had it"** and **"I missed it"**.
  There is no "skip", no "partially", no third path — an ambiguous third option
  reintroduces exactly the ambiguity D3 removed.
- Bound to `Y` ("I had it") and `N` ("I missed it"), case-insensitive, ignored
  while focus is in a text input or a modifier key is held.
- Activating either POSTs to `/api/drill/runs/[runId]/self-grade` with the
  question, the run and the user's verdict. The resulting `Attempt` carries
  `selfGraded: true` in both directions — "I had it" records
  `isCorrect: true, selfGraded: true`; "I missed it" records
  `isCorrect: false, selfGraded: true`.
- Until one of the two is chosen, the run cannot advance: the "Next question"
  action is not offered and `↵` does nothing. A no-match that is never resolved
  would leave the run's score undefined.
- Once chosen, the panel collapses into a confirmation of the recorded outcome
  ("Recorded: had it" / "Recorded: missed it") and the primary action becomes
  "Next question".
- Both buttons are disabled while the self-grade request is in flight, and a
  failure surfaces an error state rather than silently leaving the question
  unresolved.

**Keyboard**

| Key | Before submit | After `no-match`          | After `matched` / `wrong` |
| --- | ------------- | ------------------------- | ------------------------- |
| `↵` | submit        | ignored until self-graded | next question             |
| `S` | skip          | ignored                   | ignored                   |
| `Y` | (types "y")   | "I had it"                | ignored                   |
| `N` | (types "n")   | "I missed it"             | ignored                   |
| `B` | bookmark      | bookmark                  | bookmark                  |

- Before submit the input has focus, so `Y`/`N`/`S`/`B` are ordinary typed
  characters and must **not** trigger shortcuts. After submit the input is
  read-only and blurred, and the shortcuts become live. This transition is the
  subtle part of the issue.

**Responsive**

- Below `md`: the input is full width with a minimum 44px height; the keyboard
  hints (`Y` / `N` / `↵`) are hidden; **both** self-grade buttons sit in the
  thumb zone — pinned side by side at the bottom of the viewport, each at least
  44px tall, with the revealed answer and explanation scrolling behind them.
- At `md` and above: hints visible, buttons inline within the panel.

### Constraints

- All new UI lives in `apps/nextjs/src/features/drill/client/components/` —
  never in `src/components/`. This issue's declared scope is
  `features/drill/client/**` only; it adds no route, no route handler and no
  `server/api` function.
- `'use client'` on the field, the self-grade panel and the keyboard hook only.
- The verdict is a **discriminated union** typed from the drill feature's own
  types, switched on exhaustively (`conventions.md` prefers `switch` over an
  `else-if` chain at three or more branches). No `any`; no string comparison
  against a stringly-typed verdict.
- Field state (`idle | matched | no-match | wrong`) is a **CVA** variant set in
  a sibling `FillInField.variants.ts`, co-exported.
- Root elements carry `data-slot` (`fill-in-field`, `self-grade-panel`).
- Named exports only.
- Colours are theme tokens only — **no raw hex in a component**. The amber
  no-match treatment must resolve to a semantic token, not a literal. See
  [Open Questions](#open-questions--risks) — the token may need to be added by
  issue #1.
- Dark mode only.
- Geist Mono for the input, the revealed answer, and every code span; Geist Sans
  for labels and prose.
- Same-origin relative `/api/...` paths via `ky`; no `NEXT_PUBLIC_*`.
- The revealed `answerDisplay` and the explanation both render through issue
  #7's `PromptMarkdown` component — no `dangerouslySetInnerHTML`, no HTML
  string built from question content.
- **No unnecessary comments.** Per `.claude/rules/principles.md`, comments
  explain _why_, never _what_ — the code already says what it does. Do not add
  section banners, `// Step 1:` sequences, a line that restates the line below
  it, or JSDoc that repeats a signature the types already carry. A comment
  earns its place only for a non-obvious invariant, a subtle ordering, or a
  decision whose reasoning is invisible in the code, and it stays to one line
  wherever possible. If the _why_ needs a paragraph, the design is too complex
  — simplify it instead of explaining it.

## Affected Areas

- [x] `apps/nextjs` — `features/drill/client/**` only
- [ ] `apps/nextjs/prisma` (no schema or migration change)
- [ ] `infra/` (untouched)
- [ ] `.github/` (untouched)

Exact expected file set (the anomaly gate blocks a diff that strays outside it):

**New**

- `apps/nextjs/src/features/drill/client/components/FillInField.tsx`
- `apps/nextjs/src/features/drill/client/components/FillInField.variants.ts`
- `apps/nextjs/src/features/drill/client/components/SelfGradePanel.tsx`
- `apps/nextjs/src/features/drill/client/lib/selfGrade.ts`

**Modified**

- `apps/nextjs/src/features/drill/client/components/DrillCard.tsx` — replace
  issue #7's `FILL_IN` placeholder branch with `FillInField` + `SelfGradePanel`
- `apps/nextjs/src/features/drill/client/hooks/useDrillKeys.ts` — add `Y`/`N`,
  and the "shortcuts are inert while the input holds focus" rule
- `apps/nextjs/src/features/drill/client/lib/submitAnswer.ts` — widen the
  verdict type to the three-way union if #6/#7 left it choice-shaped

## Acceptance Criteria

Verified in a browser through the `playwright` plugin against a seeded run
containing at least one matchable fill-in, one multi-variant fill-in
(`` `-H` or `--human` ``) and one prose fill-in that falls through to
self-grade (the fixture from design decision **D9** provides these).

- [ ] A `FILL_IN` question renders a text input whose computed
      `font-family` resolves to the mono stack, and no A–D option list.
- [ ] The input is focused on mount, and its `autocapitalize`, `autocorrect`
      and `spellcheck` attributes are all off.
- [ ] Submit is disabled with an empty input and with a whitespace-only input,
      and enabled once a non-whitespace character is typed.
- [ ] Typing an accepted variant and submitting renders the **matched** state:
      a "Matched" label is present, and the element's colour resolves to the
      `--success` token — not the amber and not the destructive token.
- [ ] **Typing a string that matches no accepted variant renders the amber
      no-match state, not the red incorrect state**: the "No match" label is
      present, no "Incorrect" label is present, and the computed colour of the
      verdict element is the amber token, not `--destructive`.
- [ ] In the no-match state, the question's `answerDisplay` and its
      `explanation` are both visible in the DOM.
- [ ] In the no-match state, exactly two buttons are offered, with the
      accessible names "I had it" and "I missed it" — the panel contains no
      third action.
- [ ] In the no-match state, no "Next question" action is present and pressing
      `↵` does not change the URL or the rendered question.
- [ ] Pressing `Y` in the no-match state fires exactly one POST to
      `/api/drill/runs/<runId>/self-grade` whose body records the "had it"
      outcome (Playwright network log), and the panel then shows a recorded
      confirmation and a "Next question" action.
- [ ] Pressing `N` in the no-match state fires the same endpoint with the
      "missed it" outcome and likewise unlocks "Next question".
- [ ] Both self-grade buttons are disabled while the request is in flight.
- [ ] Typing the letters `y`, `n`, `s` and `b` into the focused input before
      submit inserts those characters into the input's value and triggers no
      shortcut — the question does not advance and no bookmark toggles.
- [ ] After submit the input is read-only: typing into it does not change its
      value.
- [ ] A question the server returns as explicitly `wrong` renders the
      destructive treatment with an "Incorrect" label, shows the correct answer
      and explanation, and offers **no** self-grade buttons.
- [ ] At a 390×844 viewport: the input spans the full column width and is at
      least 44px tall; the keyboard hints are not visible; **both** self-grade
      buttons are simultaneously within the viewport's bottom third after
      scrolling the explanation.
- [ ] `bun run check-types` and `bun run check-format` pass; the diff touches no
      file outside `apps/nextjs/src/features/drill/client/**`; no file under
      `src/components/` is touched.
- [ ] No raw hex colour literal appears in any file added or modified by this
      issue.

## Open Questions / Risks

- **The amber token — resolved.** This spec forbids raw hex in components, and
  the palette's only amber was `--chart-1`, a _chart_ token. Issue **#1 has
  been widened** to ship a semantic `--warning: #ffae04` /
  `--warning-foreground` pair, which is what the no-match state consumes. This
  issue is therefore **blocked on #1 landing** — if `--warning` is absent from
  the theme, stop and fix #1 rather than reaching for `--chart-1` or a hex
  literal.
- **Focus-versus-shortcut is the likeliest bug.** The same physical key means
  "type an n" before submit and "I missed it" after. Getting this wrong makes
  the app feel broken in the most-used interaction in the product. It deserves
  an explicit Playwright check in both directions, which the criteria above
  encode.
- **Self-grade honesty.** Nothing can enforce an honest self-grade; the design
  accepts that and marks such attempts `selfGraded: true` so the dashboard can
  separate auto-graded from self-graded outcomes. Any future UI that hides that
  distinction reintroduces the problem D3 solved.
- **Verdict shape depends on issue #6.** If #6's answers endpoint returns only a
  boolean `isCorrect`, the no-match state is unrepresentable and this issue is
  blocked. The plan's first step should be to confirm the endpoint returns a
  three-way verdict; if it does not, that is a bug in #6, not something to
  paper over on the client.
- **Prose fill-ins dominate the no-match path.** If normalization at seed time
  is stricter than expected, users could see amber on nearly every fill-in,
  making self-grade feel like a tax rather than a safety net. Worth watching the
  matched:no-match ratio during the first real drill run.
- **No test runner** (design doc D11 — decided, none is added) — all verification is browser-driven.
