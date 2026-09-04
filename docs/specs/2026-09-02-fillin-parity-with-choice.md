# Spec: Fill-in questions get parity with multiple-choice on submit placement, reveal hierarchy, and copy

> Status: Draft · 2026-09-02

## Problem / Context

Fill-in questions are 72% of the question bank (143 of 198 on exam 101) and are the harder, more predictive recall mode. Despite that, `DrillCard`/`FillInField`/`SelfGradePanel` give the fill-in interaction worse treatment than multiple-choice in six specific ways documented in issue #51: the primary submit action is out of the fixed bottom bar and out of the mobile thumb zone; a missed answer shows the user's wrong string more prominently than the correct one; the reveal order puts the answer before the verdict; "No match" reads as grader ambiguity rather than a self-grade prompt; the self-grade gate gives no explanation of what it records and unmounts the action bar (causing layout shift) while blocking advance; and the input uses `bg-transparent` instead of the `DESIGN.md` §"Inputs / Fields" Card White fill. This spec addresses all six as one coordinated pass over the same three files, since they interact (e.g. reordering the reveal changes what "most prominent" means for the correct answer).

## Goals

- Fill-in and multiple-choice present their primary action in the same fixed-bottom-bar position.
- On a missed or no-match fill-in, the correct answer is the most visually prominent element of the reveal; the verdict is stated before the answer; the user's own attempt is secondary, de-emphasized context.
- "No match" / "Matched" copy explains what happened and why the user is being asked to self-grade, in plain language.
- The self-grade panel states what each choice ("I had it" / "I missed it") records before the user picks one.
- Entering the blocked (self-grade-pending) state disables the surrounding controls instead of unmounting them, so there is no layout shift.
- `FillInField`'s input uses the `DESIGN.md`-specified Card White surface instead of `bg-transparent`.

## Non-Goals

- Adding a third "not sure" self-grade option — the issue calls this out as a real product/mastery-model decision to make deliberately, not default into. Out of scope for this spec; `nextMastery`/`selfGrade` keep their current two-outcome (`had-it` / `missed-it`) shape.
- Any change to the mastery-scoring algorithm (`features/drill/lib/mastery.ts`) or to how a self-grade outcome is persisted server-side (`features/drill/server/api`) — this is a presentation-layer spec (props already surface `verdict`, `outcome`, `isSubmitting`; no new server round-trip is needed for any goal above).
- Re-deriving the input spec generally (issue #51 notes this depends on #39) — this spec only brings `FillInField`'s existing input in line with the `DESIGN.md` section that already exists today (`Inputs / Fields`: Card White fill, 1px Control Gray border, 6px radius, 8px 12px padding).
- The live-region announcement wording in `verdictAnnouncement.ts` (overlaps #49) — `buildVerdictAnnouncement` is out of scope; this spec only touches the visible verdict label strings in `FillInField`'s `verdictLabels` map.
- Any change to `ChoiceOptions`, `ExplanationPanel`, or the multiple-choice reveal path — multiple-choice is already the baseline being matched, not the thing being changed.

## Requirements

### Functional

- On a `FILL_IN` question, `DrillCard`'s fixed bottom bar renders both Skip and Submit while unanswered (matching the choice-question layout), instead of `FillInField` rendering its own inline Submit button beside the input. `DrillCard` becomes the single owner of "submit this answer," for both question types.
- `FillInField` no longer renders a Submit button; it owns only the input, the reveal copy, and (per the reveal-hierarchy requirement below) the answer/verdict/attempt display once a verdict exists.
- On a fill-in verdict of `wrong` or `no-match`, the render order is: verdict statement, then the correct answer (`answerDisplay`), then the user's own submitted value, then the explanation. (`matched` has no "wrong attempt" to show — verdict statement and explanation are sufficient, matching today's behavior of hiding `answerDisplay` on `matched`.)
- The correct answer on a missed/no-match verdict is styled as the most prominent text in the reveal (larger/higher-contrast than the user's own attempt, which becomes secondary/muted context) — inverting today's hierarchy where `answerDisplay` is the smallest, most muted text on the page and the user's wrong string sits in a large amber-bordered box (that box is now the _input_, read-only, holding the user's attempt as secondary context — not the primary reveal element).
- `verdictLabels`' `no-match` copy changes from `'No match — did you have it?'` to language that states what happened (automatic matching failed) and why the user is being asked, e.g. along the lines of _"We couldn't match your answer automatically — did you have it?"_ (exact final copy is an implementation-time wording choice, not an acceptance-blocking detail, as long as it names both facts: the automatic match failed, and the user's input is now needed).
- `SelfGradePanel`'s unresolved state (`outcome === null`) gains explanatory copy stating, before the two buttons, what each button does to the permanent record (i.e., that "I had it" / "I missed it" is the self-assessment that gets written to mastery tracking and cannot be changed afterward — consistent with the existing `selfGradeOutcome !== null` re-grade block in `DrillCard.submitSelfGrade`).
- `DrillCard`'s `isBlocked` gate (`verdict?.verdict === 'no-match' && selfGradeOutcome === null`) stops unmounting the fixed bottom action bar (`{!isBlocked && (...)}`). Instead, Skip and Next question stay mounted and become `disabled` while blocked, so the bar's presence/position never changes between the answered and blocked states.
- `fillInFieldVariants`' `idle` and matched/no-match/wrong variants change their base fill from `bg-transparent` to the Card White surface DESIGN.md specifies for inputs (`bg-card` in this app's token vocabulary — see `Constraints` below), keeping each state's existing border/tint (`border-success bg-success/10` etc. for the answered states layer on top of, not instead of, the base card fill).

### Constraints

- Stay inside `features/drill/client/components/{DrillCard,FillInField,SelfGradePanel}.tsx`, `features/drill/client/components/FillInField.variants.ts`, and the verdict copy (`answerVerdict.schema.ts` only if a copy string genuinely lives there — inspection shows the current `verdictLabels` map lives in `FillInField.tsx`, not the schema file, so the schema file itself likely needs no edit; confirm at plan time rather than assuming a schema change is required).
- No `'use client'` component in this path may gain a new server round-trip; `verdict`, `outcome`, and `isSubmitting` are already props threaded from `DrillCard`'s existing `submitAnswer`/`selfGrade` calls.
- Follow this repo's CVA convention (`class-variance-authority`, `<Name>Variants` co-exported) for any new visual state in `fillInFieldVariants` rather than inline conditional classes.
- Keep `DrillCard`'s existing focus-restoration effect (the comment at `DrillCard.tsx:72-90`) correct: moving Submit out of `FillInField` and into `DrillCard`'s shared bottom bar must not break the FILL_IN-unanswered autoFocus carve-out (`question?.type === 'FILL_IN' && verdict === null`) that effect already encodes.
- Keep `useDrillKeys`' existing `onPrimary`/`onSkip` wiring working for fill-in the same way it already does for choice questions (Enter submits, `S` skips) — this spec doesn't add or remove a keybinding, only moves where the Submit button that keybinding logically pairs with is rendered.
- Disabling (not unmounting) the bottom bar while blocked must keep `Skip`/`Next question` non-interactive in a way `useDrillKeys` also respects — a disabled DOM button alone doesn't stop a keyboard shortcut from firing `onSkip`/`onPrimary`; `DrillCard` already gates both keyboard handlers behind `isBlocked` (`onPrimary: verdict ? (isBlocked ? () => {} : goNext) : submit` and `onSkip: isBlocked ? () => {} : skip`) so this constraint is about not regressing that existing gate while changing the mount behavior around it, not adding a new one.

## Affected Areas

- [x] `apps/nextjs` — `features/drill/client/components/{DrillCard,FillInField,SelfGradePanel}.tsx`, `features/drill/client/components/FillInField.variants.ts`
- [ ] `apps/nextjs/prisma` (schema/migration) — not touched; presentation-only change

## Acceptance Criteria

- [ ] On an unanswered `FILL_IN` question, the fixed bottom bar shows Skip and Submit (Submit disabled until the input is non-empty), and `FillInField` renders no button of its own.
- [ ] On a missed or no-match fill-in verdict, the rendered order (top to bottom) is: verdict statement → correct answer → the user's submitted attempt → explanation.
- [ ] On a missed or no-match fill-in verdict, the correct answer's text styling is visually more prominent (weight/size/contrast) than the user's own attempt's styling.
- [ ] The no-match verdict label no longer reads `'No match — did you have it?'` verbatim; the replacement copy states both that automatic matching failed and that the user's input is needed.
- [ ] Before either self-grade button is chosen, `SelfGradePanel` displays text explaining that the choice records a permanent, non-reversible self-assessment.
- [ ] While `isBlocked` is true (no-match verdict, self-grade not yet recorded), the fixed bottom bar (Skip / Next question) remains mounted and visible, with its controls disabled rather than absent — no element enters or leaves the DOM tree at that transition, and layout does not shift.
- [ ] `FillInField`'s input renders with the Card White background (`DESIGN.md` §"Inputs / Fields") in its `idle` state, not `bg-transparent`.
- [ ] `bun run check-types` and `bun run check-format` pass with no new errors.
- [ ] `bunx react-doctor@latest --verbose --scope changed` reports no new errors on the touched files.

## Open Questions / Risks

- Exact reveal-hierarchy styling (font size/weight/color tokens for "correct answer" vs. "your attempt") is left to `/plan`/`/implement` to choose from existing DESIGN.md typography and color tokens — this spec fixes the _order_ and _relative_ prominence, not exact class names.
- Exact final wording for the no-match label and the self-grade stakes explanation is left to implementation time, per the Functional requirements above — the acceptance criteria check for the presence and substance of the copy, not an exact string match.
- Moving Submit ownership from `FillInField` to `DrillCard` touches the disabled-condition logic (`value.trim() === ''`) that currently lives inside `FillInField` — `DrillCard` will need read access to the trimmed-emptiness of `fillInValue`, which it already holds in state, so no new prop threading is expected, but this is worth double-checking at plan time since `DrillCard` currently only reads `fillInValue` to pass it down and to call `submitFillIn`.
