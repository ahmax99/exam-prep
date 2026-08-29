# Spec: Drill UI — choice questions, answered state, explanation

> Status: Draft · 2026-08-29
> Design of record: [docs/specs/2026-08-29-cert-drill-design.md](./2026-08-29-cert-drill-design.md)
> Backlog issue: **#7** · Depends on: **#6** (drill engine), **#11** (dark mode root) · Touches: `features/drill/client/**`, `app/(public)/[cert]/drill/**`
> Visual reference: screens **03** (unanswered) and **04** (answered) of the mockup —
> <https://claude.ai/code/artifact/847f0428-275e-4248-b543-1879f3268357>

## Problem / Context

Issue #6 lands the drill engine: a run can be started, the queue is served, an
answer is graded, and the attempt + progress rows are written. None of it is
reachable from a browser — there is no drill screen. This issue builds the
screen for the two choice question types (`SINGLE_ANSWER`, `MULTIPLE_ANSWER`),
which together are 179 of the 413 questions in the bank.

The teaching moment in this app is the instant after submit (decision **D4**).
A drill that only says "wrong" teaches nothing: the whole point of the
hand-written `explanation` already sitting in every question row is to be shown
at exactly that moment, next to **both** the option the user picked and the
option that was correct. Knowing _which trap you fell for_ is the lesson.

## Goals

- Answer a single-answer or multiple-answer question and see the verdict
  immediately, without a page navigation.
- On an incorrect answer, see both the wrong pick and the correct option
  marked, so the confusion is visible rather than merely scored.
- Read the question's stored explanation in the same view, before advancing.
- Work the whole screen from the keyboard without touching the mouse.
- Work the whole screen one-handed on a phone.

## Non-Goals

- **Fill-in questions.** `FILL_IN` rendering, the no-match verdict and the
  self-grade panel are issue **#8**. This issue renders the choice branch and
  leaves a typed, unimplemented branch for `FILL_IN`.
- **Bookmark persistence.** The meta row renders the bookmark affordance and
  binds the `B` key, but the `PUT`/`DELETE /api/bookmarks/[questionId]` wiring
  and the `BookmarkToggle` component are issue **#10**. See
  [Open Questions](#open-questions--risks).
- **Run summary, retry, run history.** Issue **#9**. When the queue is
  exhausted this screen navigates to `/[cert]/drill/[runId]/summary`; building
  that page is not in scope.
- **Starting a run.** The run already exists; this screen reads it by `runId`.
- **Grading logic.** `grade.ts` and the answer endpoint are issue #6's; this
  screen only renders what the endpoint returns.
- **Full markdown.** Only inline code spans (backticks) are rendered. No
  headings, lists, links, images, or block code.
- **Light mode.** Dark only, per the design doc.

## Requirements

### Functional

**Layout — the drill screen drops navigation entirely**

- The route `/[cert]/drill/[runId]` renders a single centred column with a
  maximum width of ~640px. No sidebar rail, no top nav, no breadcrumb, no
  bottom tab bar — on any viewport. This screen is deliberately the one place
  in the app with no navigation chrome.
- A minimal run header sits above the card: the run's position (`7 / 20`) and a
  progress indicator, plus an exit affordance back to `/[cert]`.

**Meta row** (top of the question card, above the prompt)

- The question's objective code (e.g. `101.1`), in mono.
- The question type, rendered as a human label ("Single answer" /
  "Multiple answer" / "Select 2").
- An **optional** "Nth time seen" tag, rendered only when the question's
  `QuestionProgress.timesSeen` is ≥ 1 — it is absent for a first sighting.
- A bookmark toggle control at the row's trailing edge.

**Prompt**

- The prompt is rendered from the question's stored `prompt`, which is markdown
  with backticks preserved. Backtick-delimited spans render as styled `<code>`
  in mono; all other characters render as literal text.
- Prose is Geist Sans; every command, path, flag, filename and objective code is
  Geist Mono.

**Options**

- Options render as a vertical list, each with its letter (`A`, `B`, `C`, `D`)
  in a leading mono badge and its text beside it.
- `SINGLE_ANSWER`: picking an option replaces any previous pick.
- `MULTIPLE_ANSWER`: picking toggles that option; multiple may be selected at
  once. Submit is disabled until at least one option is selected.
- The options list carries the correct ARIA semantics for its type
  (`radiogroup`/`radio` for single, `group` + checkboxes for multiple) so the
  control is reachable by assistive tech and by Playwright's role selectors.

**Answered state** (screen 04)

- On submit, the client POSTs to `/api/drill/runs/[runId]/answers` and renders
  the returned verdict. The whole options list becomes read-only — no option
  can be changed after submit.
- The **correct** option(s) are marked with the success treatment.
- If the user's pick was wrong, the user's picked option is _also_ marked, with
  the incorrect treatment, **simultaneously** with the correct one. Both marks
  are visible at the same time; the correct answer is never merely revealed in
  place of the user's pick.
- If the user's pick was correct, only the success treatment appears.
- Each mark carries a text label, not colour alone ("Your answer",
  "Correct answer"), so the state is readable without colour perception and
  assertable from a Playwright accessibility snapshot.

**Explanation panel**

- After submit, an explanation panel appears below the options, fed from the
  question's stored `explanation`, rendered through the same inline-code
  renderer as the prompt.
- The panel is absent before submit.

**Advancing**

- After submit, the primary action becomes "Next question". Activating it
  advances to the next question in the run's frozen `questionIds` order.
- "Skip" is available _before_ submit and moves to the next question without
  recording an attempt.
- When the last question is answered or skipped, the screen navigates to
  `/[cert]/drill/[runId]/summary`.

**Keyboard-first**

| Key       | Before submit               | After submit    |
| --------- | --------------------------- | --------------- |
| `A` – `D` | select / toggle that option | ignored         |
| `↵`       | submit                      | next question   |
| `S`       | skip (no attempt recorded)  | ignored         |
| `B`       | toggle bookmark             | toggle bookmark |

- Keys are case-insensitive and are ignored while focus is inside a text input
  or when a modifier (`Ctrl`/`Meta`/`Alt`) is held.
- Each key's binding is shown as a visible hint beside the control it drives on
  viewports ≥ `md`.

**Responsive**

- Below the `md` breakpoint: options become full-width tap targets with a
  minimum 44px touch height; keyboard hints are hidden; the Submit / Next
  button pins to the bottom of the viewport (thumb zone) and stays reachable
  while the prompt and explanation scroll behind it.
- At `md` and above: the single centred column, keyboard hints visible, the
  action button sits inline at the end of the card.

### Constraints

- Feature UI lives in `apps/nextjs/src/features/drill/client/components/` —
  **never** in `src/components/`. Nothing in this issue belongs in the atomic
  layers.
- `'use client'` only on the components that genuinely need state, event
  handlers or `window` (the card, options, keyboard hook). The route's
  `page.tsx` stays a Server Component that fetches the run via the drill
  feature's `server/api` and passes plain data down.
- Browser code never touches Prisma. The only data the client fetches itself is
  through the same-origin relative path `/api/drill/runs/[runId]/answers`; no
  absolute base URL, no `NEXT_PUBLIC_*` variable.
- Variant systems (option state: idle / selected / correct / incorrect) use
  **CVA** in a sibling `*.variants.ts` file, matching the existing
  `Button.variants.ts` pattern, and the variants object is co-exported.
- Every component's root element carries `data-slot="<component-name>"`.
- Named exports only; the sole default export is the Next.js `page.tsx`.
- `any` is an oxlint error. The verdict payload is a discriminated union typed
  from the drill feature's own types — no casting.
- Colours come from theme tokens (`--success`, `--destructive`,
  `--muted-foreground`, `--border`) via Tailwind classes. **No raw hex in a
  component.** The `--success` token is issue #1's; this issue consumes it.
- Dark mode only — no `light:`/`dark:` pairs, no light-mode fallbacks.
- Geist Mono (`font-mono`) for option letters, objective codes, inline code and
  every figure; Geist Sans for prose and labels.
- Client HTTP calls use `ky` (already a dependency) and the neverthrow /
  `AppError` conventions where a failure must be surfaced.

**Security constraint — markdown rendering**

- The inline-code renderer must **not** use `dangerouslySetInnerHTML` and must
  not build an HTML string from question content. It tokenizes the source
  string on backticks and returns React nodes (`<code>` and text), so every
  character in the bank is escaped by React itself. Angle brackets, ampersands
  and quotes in a prompt are rendered literally and cannot become markup.
- No markdown library is added for this. If a fuller renderer is ever needed,
  that is a separate, deliberate decision (see Open Questions).
- **No unnecessary comments.** Per `.claude/rules/principles.md`, comments
  explain _why_, never _what_ — the code already says what it does. Do not add
  section banners, `// Step 1:` sequences, a line that restates the line below
  it, or JSDoc that repeats a signature the types already carry. A comment
  earns its place only for a non-obvious invariant, a subtle ordering, or a
  decision whose reasoning is invisible in the code, and it stays to one line
  wherever possible. If the _why_ needs a paragraph, the design is too complex
  — simplify it instead of explaining it.

## Affected Areas

- [x] `apps/nextjs` — `features/drill/client/**`, `app/(public)/[cert]/drill/**`
- [ ] `apps/nextjs/prisma` (no schema or migration change)
- [ ] `infra/` (untouched)
- [ ] `.github/` (untouched)

Exact expected file set (the anomaly gate blocks a diff that strays outside it):

**New**

- `apps/nextjs/src/app/(public)/[cert]/drill/[runId]/page.tsx`
- `apps/nextjs/src/features/drill/client/components/DrillCard.tsx`
- `apps/nextjs/src/features/drill/client/components/QuestionMeta.tsx`
- `apps/nextjs/src/features/drill/client/components/ChoiceOptions.tsx`
- `apps/nextjs/src/features/drill/client/components/ChoiceOptions.variants.ts`
- `apps/nextjs/src/features/drill/client/components/ExplanationPanel.tsx`
- `apps/nextjs/src/features/drill/client/components/PromptMarkdown.tsx`
- `apps/nextjs/src/features/drill/client/hooks/useDrillKeys.ts`
- `apps/nextjs/src/features/drill/client/lib/submitAnswer.ts`

**Modified**

- none expected. If issue #6 did not export a client-consumable verdict type,
  one additional type file under `features/drill/` may be added — call it out
  in the plan rather than letting the diff widen silently.

## Acceptance Criteria

Verified in a browser through the `playwright` plugin against a seeded run
(the repo has no test runner).

- [ ] Navigating to `/[cert]/drill/[runId]` renders exactly one question card;
      the accessibility snapshot contains no `navigation` landmark, no sidebar
      rail and no bottom tab bar at any viewport width.
- [ ] The question column's rendered width never exceeds 640px at a 1440px
      viewport.
- [ ] The meta row shows the question's objective code in a `font-mono`
      element, and a type label reading "Single answer" or "Multiple answer".
- [ ] For a question whose `QuestionProgress.timesSeen` is 0, no "time seen"
      tag is present in the DOM; for one with `timesSeen` ≥ 1, a tag reading
      "2nd time seen" (or the matching ordinal) is present.
- [ ] A prompt containing `` `ls -l` `` renders a `<code>` element whose text is
      `ls -l`, and that element resolves to the mono font family.
- [ ] A prompt containing the literal text `<script>alert(1)</script>` renders
      it as visible text; `document.querySelectorAll('script')` gains no entry
      and no dialog fires.
- [ ] On a `SINGLE_ANSWER` question, pressing `B` on the keyboard selects
      option B; pressing `C` then leaves only option C selected.
- [ ] On a `MULTIPLE_ANSWER` question, pressing `A` then `C` leaves both A and
      C selected simultaneously.
- [ ] Submit is disabled while no option is selected and enabled once one is.
- [ ] After submitting a **wrong** answer, the DOM contains both a
      "Your answer" marker on the option the user picked **and** a
      "Correct answer" marker on the correct option, at the same time.
- [ ] After submitting a **correct** answer, a "Correct answer" marker is
      present and no "Your answer" incorrect marker is rendered.
- [ ] After submit, clicking a different option does not change the selection
      and fires no further request to `/api/drill/runs/[runId]/answers`
      (verified via the Playwright network log).
- [ ] The explanation panel is absent before submit and present after, and its
      text matches the question's stored `explanation`.
- [ ] Pressing `↵` before submit submits the answer; pressing `↵` again
      advances to the next question (the meta row's objective code changes).
- [ ] Pressing `S` before submit advances to the next question and fires **no**
      request to the answers endpoint.
- [ ] Answering the final question navigates to a URL ending
      `/drill/<runId>/summary`.
- [ ] Typing `a` into a focused text input on the page does not select
      option A.
- [ ] At a 390×844 viewport: each option's bounding box spans the full column
      width and is at least 44px tall; the keyboard hints are not visible; the
      Submit button's bounding box remains within the viewport after scrolling
      the prompt.
- [ ] `bun run check-types` and `bun run check-format` both pass; no file under
      `src/components/` is touched by the diff; no `'use client'` appears in
      `page.tsx`.
- [ ] No raw hex colour literal appears in any file added by this issue.

## Open Questions / Risks

- **Bookmark control ownership (real ordering conflict).** The mockup's meta
  row carries a bookmark toggle and `B` is a drill key, but `BookmarkToggle`
  and the bookmark endpoints belong to issue **#10**, which this issue does not
  depend on. Resolution for this issue: `QuestionMeta` renders a presentational
  bookmark button and exposes an optional `bookmarkSlot` prop; the button's
  pressed state is local to the session and performs **no** network call, and
  the component carries a one-line comment saying issue #10 replaces it. Issue
  #10's spec names `QuestionMeta.tsx` in its own affected-file list so the swap
  does not trip its anomaly gate.
- **Client-side run state.** Whether the run's questions are all sent to the
  client up front (fast, but leaks correct answers into the page payload) or
  fetched one at a time is a `/plan` decision. Sending the whole run including
  `correctLetters` would let a curious reader read answers out of the RSC
  payload — the recommendation is to send only the current question, without
  `correctLetters`, and let the answer endpoint return the correct letters as
  part of its verdict.
- **`FILL_IN` branch before issue #8.** Between #7 and #8 a run that serves a
  fill-in question has nothing to render. The branch should render an explicit
  "not yet implemented" placeholder rather than crashing or rendering an empty
  card, so the screen is exercisable end to end.
- **Markdown scope creep.** The bank may contain markdown constructs beyond
  inline code (bold, lists). Rendering them literally is acceptable for now;
  adding a markdown library is a dependency decision that belongs in its own
  issue, not this one.
- **No test runner** (design doc D11 — decided, none is added). Every criterion above is browser-verified;
  the inline-code tokenizer is the piece that would most benefit from a unit
  test if a runner is ever introduced.
