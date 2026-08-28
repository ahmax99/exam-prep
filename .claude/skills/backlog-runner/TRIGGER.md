# backlog-runner — Trigger Definition

> This file is the launch contract for the loop. It specifies what the loop
> is trying to achieve, where its state lives, and exactly how to start a
> run.

---

## Verifiable goal

Per issue, the loop stops advancing once:

> **The issue's PR is opened after `/implement` + `/qa` pass the
> deterministic gate.**

Per invocation, the run stops once 3 issues have been advanced or no
advanceable issue remains — see `SKILL.md`. There is no single "loop is
fully done" predicate: `backlog-runner` is a recurring, manually re-fired
sweep over a queue, not a run-to-completion job.

---

## State file

```
.claude/backlog-state/issue-<n>/.agent-state.json   (one per issue, in that issue's worktree)
```

There is no single state file for the whole loop — durable queue state lives
on the GitHub issue as labels/comments; this ephemeral per-issue file is
created when the issue's worktree is first created and removed once the
worktree is removed after merge. Each issue's phase work happens in its own
isolated git worktree (delegated to the `superpowers:using-git-worktrees`
skill, see `SKILL.md` step 0), so uncommitted state in one issue's worktree
cannot block or leak into another's. See `SKILL.md` for the full two-tier
rationale, and commit `7d99155` (#73) for the original design (the design
plan itself lives under the gitignored `.claude/plans/**`, so it isn't a
committed, team-visible artifact — commit history is).

---

## Trigger: manual only

This loop has **no cron, webhook, or scheduled trigger** — that was
explicitly rejected in the original design (commit `7d99155`, #73) in favor
of a human-paced, human-gated sweep. Generic cron/CLI and scheduler sections
are intentionally omitted; N/A for this loop.

### Claude Code

```
/run-backlog
```

> **Flag:** verify `/run-backlog` still exists and accepts this syntax
> against the current `.claude/commands/run-backlog.md` before relying on
> it — command surfaces can change.

Optional: pass an issue number to process only that issue this run (see
`.claude/commands/run-backlog.md` for the exact argument contract).

There is no host-agnostic fallback prompt beyond invoking the command
directly, since this loop is Claude-Code-specific (it orchestrates
`/spec`/`/plan`/`/implement`/`/qa`, which are this repo's own project
commands, not portable across hosts as-is).

---

## Trigger notes

- **Always verify `/run-backlog`'s argument syntax against
  `.claude/commands/run-backlog.md`** before relying on it in a script or
  muscle memory — command surfaces can change.
- Before the first live run, confirm `HUMAN-GATES.md` gates G0 (pre-plan), G1
  (pre-implement / first live run), and G2 (anomaly) are understood and that
  an approver is reachable to clear the `agent:approved` label.
- The budget limits in `HUMAN-GATES.md` (3 issues/invocation, 3 qa-retries/
  issue) take precedence over how often a human chooses to re-run
  `/run-backlog`. Running it more often does not raise those caps.
