# Run Backlog

You are the manual trigger for the **`backlog-runner`** loop. All discovery,
transition, verification, and gate logic lives in
`.claude/skills/backlog-runner/SKILL.md` — this command does not restate it.

## Input

`$ARGUMENTS` is optional. If empty, process up to 3 advanceable issues as
`SKILL.md`'s discovery order decides. If a single issue number is given
(e.g. `/run-backlog 42`), restrict discovery to that issue only — still
subject to the same per-issue gating in `SKILL.md`; this does not bypass any
gate or the qa-retry cap.

## Process

1. Load `.claude/skills/backlog-runner/SKILL.md`, `HUMAN-GATES.md`, and
   `TRIGGER.md`.
2. Run the loop exactly as `SKILL.md` describes: discover advanceable
   issues, advance up to 3 of them (or the single issue from `$ARGUMENTS`)
   by one phase each, verify deterministically where `SKILL.md` calls for
   it, and write state back.
3. Stop when the budget in `HUMAN-GATES.md` is hit or no advanceable issue
   remains — do not keep looping past that point in this invocation.

## Report back

Print, per issue touched this run: issue number, the phase it moved from →
to, and the reason if it didn't advance (e.g. "waiting on `agent:approved`",
"blocked: infra diff"). Then tell the user how many issues are
still queued vs. paused on a human gate, per `SKILL.md`'s discovery query.

## Notes

- This command only orchestrates `/spec`, `/plan`, `/implement`, and `/qa`
  plus `gh` calls and per-issue git worktree isolation, delegated to the
  `superpowers:using-git-worktrees` skill (see `SKILL.md` step 0) — it never
  merges a PR itself (see `HUMAN-GATES.md` gate G3) and never edits
  application source code that a human hasn't already approved past the plan
  gate.
- Before the first live run, run
  `.claude/skills/backlog-runner/scripts/bootstrap_labels.sh` once (see
  `SKILL.md` → "How to run").
