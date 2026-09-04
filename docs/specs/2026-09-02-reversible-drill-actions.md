# Spec: Make drill-loop actions reversible and give failed submits a real recovery path

> Status: Draft · 2026-09-02

## Problem / Context

Every consequential action in the drill loop is currently one keystroke away and permanent: `goNext` only ever increments `currentIndex` (no way back to a passed question), `S` skips with no confirmation or undo, `B` silently bookmarks instead of selecting option "B" on any question that has one, bookmark removal has no confirm/undo, and a failed submit surfaces only as a transient toast carrying the raw error string, with no inline retry. Codebase inspection (`DrillCard.tsx`, `useDrillKeys.ts`, `DrillContextRail.tsx`, `BookmarkRow.tsx`/`BookmarkToggle.tsx`, `mapToAppError.ts`) confirms all five as currently implemented, matching issue #52.

## Goals

- A user can navigate back to a question already visited in the current run (answered or skipped) and view it, without restarting the run.
- The same navigation recovers a skipped question — returning to it re-presents the original, still-unanswered card, so the user can now answer it.
- `B` never silently overrides a lettered "B" option; the on-screen shortcut legend never advertises a keybinding that isn't actually active for the question on screen.
- Removing a bookmark from the bookmarks shelf is undoable.
- A failed answer/self-grade submission shows a plain-language message inline (not only in a toast that can be missed) with a retry action, and no raw internal/network error string ever reaches the user.

## Non-Goals

- Editing or re-submitting an already-answered question, or re-grading an already-self-graded one. Returning to a visited question is read-only review, not redo — the run's frozen `questionIds` and its one-attempt-per-question-per-run invariant (which `mastery.ts`'s consecutive-correct-streak model depends on) stay intact. The issue's fix sketch explicitly flags "allowing a correction while the question is still on screen" as a real product/mastery-model decision to make deliberately rather than default into; this spec makes that decision explicitly: no correction, only review. A future spec can revisit this if a product need for correction emerges.
- Explaining what each self-grade choice ("I had it" / "I missed it") records before the user picks. The issue itself notes this overlaps #51, and #51's spec (`2026-09-02-fillin-parity-with-choice.md`) already carries this as one of its own acceptance criteria against the same `SelfGradePanel.tsx`. Restating it here would give `/plan` two specs independently instructing changes to the same panel's copy. `/plan` should sequence #51's implementation before #52's (or verify #51 already landed) rather than this spec re-deriving the same requirement.
- Moving the global bookmark shortcut off `B` entirely. The fix is scoped to suppressing `B`-as-bookmark only on the specific question where it would collide with a real option letter — see Requirements.
- Any change to how skip is recorded server-side, or to `queue.ts`'s cross-run requeue ordering (`[...wrong, ...unseen, ...shaky]`). This spec only changes what's reachable within one already-frozen run via client-side navigation state; a skipped question already leaves no server-side attempt row, so nothing server-side needs to change for it to become answerable again within the same run.
- Undo-by-timeout or a confirmation modal for skip. The issue's fix sketch prefers an undo affordance over a confirm dialog for skip specifically ("undo is the better answer than a confirm dialog"); this spec gets that undo for free by building general backward navigation (see Requirements) rather than a skip-specific mechanism, so there's no separate skip-undo UI to design or maintain.

## Requirements

### Functional

- `DrillCard` gains a navigation history covering every question index reached in the run so far (from the frozen `questions` array), distinct from a single monotonic `currentIndex`. A "Previous" control appears whenever the currently viewed index is not the first, moving the view back one question; a "Next question"-equivalent (or the existing per-state Skip/Submit bar) moves forward, up to the furthest index reached.
- Viewing a previously **answered** question (a verdict exists for it) renders it read-only: the original selection/fill-in value and verdict/explanation, no active Submit/self-grade controls.
- Viewing a previously **skipped** question (visited, but no verdict was ever recorded for it) renders it exactly as an unanswered question does today — full Skip/Submit/self-grade interaction — so answering it there is a first, single, normal answer for that question, not a resubmission.
- `DrillCard` needs to retain, per visited question id, whatever it needs to redisplay that question's answered/skipped state without a re-fetch: at minimum the selected letters or fill-in value and the `AnswerVerdict` (or its absence, for a skip). This is new client-side state, not a new network call.
- `useDrillKeys`' key handler stops treating `B` as an unconditional bookmark shortcut: when the current question's own option letters include `B`, that key follows the normal `optionLetters.includes(letter)` path (selects option B) instead of the bookmark branch. On a question with no `B` option, `B` still bookmarks, unchanged.
- `DrillContextRail`'s shortcut legend stops showing the `B → Bookmark` row on any question where `B` is currently an option letter (i.e., the legend must reflect the same condition `useDrillKeys` now branches on), so the legend never claims a binding that isn't active.
- The "Previous" navigation's keybinding must not be a single `a`–`z` letter — reusing that class of key for a second cross-cutting shortcut is exactly the collision this spec is fixing for `B`, so it must not reintroduce the same problem for a different letter. `/plan` picks the concrete key (e.g. `Backspace` or an arrow key) subject to this constraint and to not colliding with `useDrillKeys`' existing `Enter`/`S`/`Y`/`N`/letter/`B` bindings.
- `BookmarkRow`'s `Remove` action changes from an immediate, silent removal to one that surfaces an undo affordance after the fact (e.g. a toast carrying an "Undo" action that re-adds the same bookmark) rather than requiring a confirmation step before the removal happens — consistent with the issue's stated preference for undo over confirm, and with this repo's existing `sonner`-toast usage for feedback.
- `mapToAppError`'s generic-`Error` branch (`error instanceof Error → new AppError('INTERNAL_ERROR', error.message)`) stops forwarding the caught error's raw `message` and instead uses `ERROR_DEFINITIONS.INTERNAL_ERROR`'s existing friendly default — the same treatment `HTTPError`s already get one branch above. This is the one place `catchAsyncError`'s callers all funnel through, so fixing it here (rather than unwrapping/rewriting the message at each of `DrillCard`'s three call sites and `BookmarkToggle`'s) is this repo's own "aggregate handling at a boundary" principle applied to the actual boundary, not a workaround at each caller.
- `DrillCard`'s `submit`/`submitFillIn`/`submitSelfGrade` failure paths keep the existing `toast.error(...)` **and** add a persistent inline error state on the card (cleared on a new attempt or on success) that names what failed in plain language and offers a "Retry" control which re-invokes the same submit call with the same captured arguments. This is additive to the toast, not a replacement — the toast is transient feedback, the inline state is the actual recovery path for a user who missed it.

### Constraints

- Stay inside `features/drill/client/components/{DrillCard,SelfGradePanel}.tsx`, `features/drill/client/components/DrillContextRail.tsx` (new, added to the issue's listed scope — the shortcut-legend fix lives here, not in the files the issue named, since this is the component that renders the legend), `features/drill/client/hooks/useDrillKeys.ts`, `features/drill/client/lib/{submitAnswer,selfGrade}.ts`, `features/bookmarks/client/components/BookmarkRow.tsx`, and `features/error/lib/mapToAppError.ts` (new, added for the reason given above).
- No `SelfGradePanel.tsx` copy changes belong to this spec — see Non-Goals. If `/plan` finds it needs to touch that file for layout reasons while wiring the read-only/history view, it must not also carry #51's stakes-explanation copy change; keep the two concerns in separate, attributable diffs.
- Preserve the one-attempt-per-question-per-run invariant `mastery.ts`'s `MASTERY_STREAK` consecutive-correct logic depends on — nothing in this spec re-submits an already-answered question.
- Preserve `useDrillKeys`' existing focus-containment gate (`containerRef.current?.contains(document.activeElement)`) and repeat-key guard (`event.repeat`) — the new Previous binding goes through the same handler, not a second listener.
- `mapToAppError`'s change must not alter behavior for the `AppError` or `HTTPError` branches — only the generic `Error` branch's message is affected. Any code elsewhere in the app currently depending on a raw `Error.message` surfacing via this path is out of scope to hunt down exhaustively here, but `/plan` should grep for other `.match((_, error) => toast.error(error.message))`-shaped call sites this change would also improve, since the fix is global by construction.

## Affected Areas

- [x] `apps/nextjs` — `features/drill/client/components/{DrillCard,DrillContextRail}.tsx`, `features/drill/client/hooks/useDrillKeys.ts`, `features/drill/client/lib/{submitAnswer,selfGrade}.ts`, `features/bookmarks/client/components/BookmarkRow.tsx`, `features/error/lib/mapToAppError.ts`
- [ ] `apps/nextjs/prisma` (schema/migration) — not touched; no server-side or schema change

## Acceptance Criteria

- [ ] From any question past the first in a run, a "Previous" control (and its non-letter keyboard shortcut) is available and moves the view back one question.
- [ ] A previously answered question, when viewed via Previous, shows its original selection/value and verdict, read-only — no way to change or resubmit it from that view.
- [ ] A previously skipped question, when viewed via Previous, shows as fully unanswered and can be answered normally, without restarting the run.
- [ ] On a question whose options include letter `B`, pressing `B` selects option B, not the bookmark toggle; the shortcut legend on that question does not list `B → Bookmark`.
- [ ] On a question with no `B` option, pressing `B` still toggles the bookmark, and the legend still lists it.
- [ ] Removing a bookmark from the bookmarks shelf offers an undo that restores the same bookmark; nothing has silently been decided about whether that undo requires a confirm-first step (this spec chose undo-after over confirm-before, per the issue's stated preference).
- [ ] A failed answer or self-grade submission shows a plain-language inline message on the card (not only a toast) with a working Retry control.
- [ ] No raw `Error.message` from a non-`HTTPError`/`AppError` failure (e.g. a network failure) reaches any toast or inline message anywhere `catchAsyncError` is used — verified at minimum for the drill submit/self-grade and bookmark remove/add paths.
- [ ] `bun run check-types` and `bun run check-format` pass with no new errors.
- [ ] `bunx react-doctor@latest --verbose --scope changed` reports no new errors on the touched files.

## Open Questions / Risks

- Exact keybinding for Previous (`Backspace` vs. an arrow key vs. something else) is left to `/plan`, constrained to "not a single a–z letter" as stated above.
- Exact retention shape for per-question visited state in `DrillCard` (a `Map`/`Record` keyed by question id vs. by index) is an implementation choice for `/plan`; the requirement is only that a read-only view is reconstructable without a re-fetch.
- This spec and #51's spec (`2026-09-02-fillin-parity-with-choice.md`) both modify `DrillCard.tsx` and reference `SelfGradePanel.tsx`. Land and plan #51 first (or confirm it's already merged) before planning this one, to avoid two independent plans proposing conflicting edits to the same files.
- The `mapToAppError.ts` change is a small, generalizable fix reached for a reason specific to this issue's own acceptance criteria; if a reviewer prefers it scoped differently (e.g. only inside the drill call sites), that's a legitimate alternative `/plan` or `/qa` can flag — it's called out explicitly here so it isn't mistaken for undisclosed scope creep.
