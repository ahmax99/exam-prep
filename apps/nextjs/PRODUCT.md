# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A single user (the developer) studying for the LPIC-1 Linux Administrator
certification. This is a personal drill tool, not a product built for
strangers — there is no signup, no accounts, and no plan to add other users.
The catalog schema is deliberately cert-agnostic because more certifications
are planned after LPIC-1, but the audience stays the same: one learner
working through one exam at a time.

## Product Purpose

A spaced-recall drill tool for certification exam prep. The core loop: pick a
scope (a whole exam, a single objective, or a narrower slice), answer a queue
of questions, get immediate feedback, and watch per-objective mastery move as
a result. Success is passing the real LPIC-1 exam — not completing a demo, and
not "more questions answered."

## Positioning

Recall over recognition. A meaningful share of the question bank is fill-in
rather than multiple-choice: the user types the actual answer and self-grades
it against the accepted variants, instead of recognizing it among four
options. That is closer to what the real exam demands than a stock
multiple-choice quiz bank, and it is the thing a generic flashcard tool
(Anki, a PDF question dump) does not force. Mastery is tracked per exam
objective (e.g. LPIC-1's 101.3), not per deck or per exam as a whole, so the
tool can point at exactly which objective is weak rather than an aggregate
score.

## Operating Context

A study session: launch a drill scoped to an exam, an objective, or a
narrower selection; work through the queue answering choice or fill-in
questions; self-grade the fill-ins the automatic matcher can't resolve;
bookmark questions worth revisiting; land on a run summary that reports what
was missed. Mastery persists across runs and sessions — the drill queue is
meant to be re-entered repeatedly over the weeks before the exam, not
completed once.

## Capabilities and Constraints

- **No authentication layer, by design.** This is a personal, single-user
  tool. Do not treat the absence of accounts as a gap to fill — it is a
  deliberate non-goal, not missing scope.
- **Multi-certification schema, single certification of data today.**
  `Certification` and `Exam` are modeled generally; only LPIC-1 (exam 101)
  has a seeded question bank. More certifications are a planned, not
  hypothetical, extension — keep new work general rather than special-cased
  to LPIC-1.
- **Three question types.** `SINGLE_ANSWER` and `MULTIPLE_ANSWER` (graded by
  set equality over the chosen letters) and `FILL_IN` (typed answer, normalized
  and matched against accepted-answer variants; when the matcher can't decide
  it returns `no-match`, not `wrong`, and the verdict is resolved by a
  self-grade).
- **Mastery is stateful and per-question.** `QuestionProgress` tracks a
  `MasteryState` (`WRONG` → `SHAKY` → `MASTERED`, two consecutive correct
  answers to promote) per question across repeated `DrillRun`s and
  `Attempt`s — not a per-session score that resets.
- **Question banks are seeded from JSON fixtures**, not authored in the UI —
  there is no question-editing surface, and none is planned.
- **No test suite.** Correctness is verified by type-checking, linting, and
  manual/browser verification, per this repo's own conventions.

## Brand Commitments

No product name has been chosen, and none should be invented here. The two
placeholders that used to stand in for one are gone: the wordmark now sets the
repository's own name as a monospace lockup with an accent block cursor, and
page titles read `Exam Prep` rather than a boilerplate suffix. Both are literal
descriptions of what this is, deliberately not branding — treat them as the
honest default, not as a naming decision already made.

One visual commitment does exist, and it is a constraint rather than an
identity: colour is organised into **three tiers and nothing else** — a single
action blue for the one peak action per surface, a categorical arc for taxonomy
(topics, objectives, chart series), and green/amber/red reserved for the verdict
states (`correct` / `shaky` / `wrong`). The verdict reservation is why the
taxonomy arc lives entirely on the cool half of the colour wheel: the warm half
is already spoken for, and a warm mark would be read as a grade. See
`DESIGN.md` for the rules that govern it.

## Evidence on Hand

A real LPIC-1 (exam 101) question bank, seeded from JSON fixtures. No
testimonials, case studies, or usage metrics exist, and none should be
fabricated — this is a single-user tool with no external evidence to draw on.

## Product Principles

1. **Recall over recognition.** The fill-in-plus-self-grade loop is the
   primary mechanism this tool exists to provide; multiple-choice is the
   easier, secondary mode, not the default to design toward.
2. **Mastery is per-objective, not per-exam.** The granularity is what makes
   "drill my weak spots" possible instead of just "drill everything again."
3. **Built for one real exam attempt, not a demo.** Every surface should
   assume its user is actually about to sit LPIC-1 — copy, states, and error
   handling should read that way.
4. **General enough for the next certification.** The catalog/exam/question
   schema stays cert-agnostic on purpose; don't let LPIC-1-specific
   assumptions leak into shared code.
5. **No accounts, no auth.** A personal tool that trusts its single user —
   don't add gating machinery this doesn't need.

## Accessibility & Inclusion

WCAG 2.1 AA: ≥4.5:1 body-text contrast (≥3:1 large text), full keyboard
navigation with visible focus rings, screen-reader labels and live-region
announcements for state changes (an answer verdict, a mastery update), and
`prefers-reduced-motion` alternatives for every animation. This is the
target the app is held to, not a claim that it currently meets it — known
gaps are tracked separately in the design backlog.
