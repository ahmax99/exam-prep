---
name: backlog-runner
description: >
  Self-running loop: discover ready-for-agent GitHub issues and advance each
  one phase at a time through /spec -> /plan -> /implement + /qa -> gh pr
  create, pausing at human gates and escalating anomalies. Triggered manually
  via /run-backlog.
---

# backlog-runner

## Goal

**Exit predicate (per issue):** the issue's PR is opened after `/implement` +
`/qa` pass the deterministic gate. Merging/closing the PR is a human action
outside this loop's exit predicate — see `HUMAN-GATES.md`.

**Exit predicate (per phase, within one issue):** the phase's deterministic
check passes — a fresh `/spec`/`/plan` draft posted as a comment, or
`scripts/verify_qa_gate.sh` returning exit 0 on the persisted `/qa` report.

The loop does not run "until done" in one sitting. Each `/run-backlog`
invocation advances up to 3 issues by exactly one phase, then stops. Run it
again to keep going.

---

## Conventions (durable only — never write progress here)

This file is **read-only at runtime.** It carries logic, not state.

Rules:

- **Never write progress, counters, timestamps, or iteration results here.**
  All changing data belongs in the external state described below.
- This file is loaded fresh on every `/run-backlog` invocation. Anything
  written here between runs disappears the moment the next run reloads it
  from disk.
- Durable knowledge only: the discovery order, the per-phase transition
  table, the verifier handoff, and the gate/budget references. No application
  domain rules live here either — this skill reads the same `.claude/rules/*`
  every other project command already reads.

The boundary is two-tier, per the original loop design (commit `7d99155`,
#73) — `.claude/plans/**` is gitignored, so that design plan isn't a
committed artifact; commit history is the durable reference:

- **Durable queue state** — GitHub issue labels + comments (checkable, visible
  to the whole team).
- **Ephemeral per-issue state** — `.claude/backlog-state/issue-<n>/.agent-state.json`
  in the issue's worktree, gitignored, created when the worktree is created and
  disposed when the worktree is removed after merge.

---

## Pattern: ReAct + deterministic verifier

The loop follows the **ReAct + deterministic verifier** pattern (loop-maker's
default: one workstream, "done" is a program-checkable predicate). Each
`/run-backlog` invocation proceeds in order:

1. **Discover** advanceable issues (below).
2. For up to 3 of them, **advance exactly one phase** by entering that
   issue's dedicated git worktree (per-phase transition table below) —
   each issue's work is isolated in its own worktree, not switched in and
   out of one shared working directory.
3. **Verify** deterministically where a verify step exists — never on the
   model's own reading of a report.
4. **Write state** back — both the ephemeral `.agent-state.json` and the
   durable GitHub label(s)/comment.
5. Stop. Do not chain a second phase for the same issue in the same run.

### 0 — Workspace isolation (per-issue worktree)

Each issue's phase work happens in its own isolated git worktree, so
uncommitted state in one issue's worktree cannot block, be overwritten by, or
leak into another issue's work. Before **any** phase action for an issue (new
or resumed):

- **Delegate worktree creation/re-entry to the `superpowers:using-git-worktrees`
  skill** — do not embed a manual `git worktree add` call sequence here.
  Declare the workspace preference up front (project-local — the skill's
  native-tool location or its repo-local `.worktrees/` fallback, never a
  sibling directory outside the repo; that was the exact problem, issue #82,
  that motivated moving away from worktrees the first time) so the skill
  doesn't pause for interactive consent, since this loop runs unattended
  between human gates. **Always pass a deterministic, issue-derived name**
  (e.g. `EnterWorktree(name: "issue-<n>")`) when creating — never let the
  tool generate a random one — so the re-entry lookup below is guaranteed to
  find it later.
- **Branch naming is tool-assigned, not `agent/issue-<n>`.** When the skill
  uses a native tool (e.g. `EnterWorktree(name: "issue-<n>")`), the resulting
  branch name is whatever that tool derives (confirmed empirically: the
  native tool in this environment names it `worktree-issue-<n>`, not
  `agent/issue-<n>`) — never assume a specific branch name. Whatever branch
  the skill actually creates or re-enters, **record it verbatim** in
  `.agent-state.json`'s `branch` field the first time, and read that field
  (not a template string) on every subsequent phase for the same issue and
  when creating the PR.
- **Re-entering an existing worktree:** before creating a new one, check `git
worktree list` for a path already associated with this issue (e.g. one
  whose name embeds `issue-<n>`). If found, re-enter it (the native tool's
  `path` parameter, or the skill's fallback equivalent) instead of creating a
  second one for the same issue.
- **Exit back to the main repo before moving to the next issue.** The
  `using-git-worktrees` skill's own Step 0 treats "already in a linked
  worktree" as "isolation already exists, don't create another" — so if the
  loop stayed inside issue A's worktree while starting issue B's phase, the
  skill would silently reuse issue A's workspace for issue B's work. Always
  return to the main repo directory (`ExitWorktree(action: "keep")` — never
  `"remove"` mid-lifecycle, since the issue isn't done) after finishing one
  issue's phase and before evaluating the next issue in the same invocation.
- **Copy local env files in (repo-specific, after the skill returns).**
  Immediately after the worktree exists and before any `/spec`/`/plan`/
  `/implement` step runs in it, copy this repo's three gitignored per-app env
  files from the main worktree into the same relative paths in the new
  worktree: `apps/backend-boilerplate/.env`, `apps/nextjs-boilerplate/.env`,
  `shared/neon/.env`. A worktree only contains tracked files, so these
  gitignored files are otherwise absent — and `/implement`'s gates (`bun run
check-types`, the dev server) need them. This is a filesystem copy into an
  already-gitignored destination; never `git add` these files.
- **Commit before moving on.** Every phase that writes tracked files (the
  spec write, `/implement`'s code changes) must end with a `git commit` on
  that issue's branch, in its worktree, before the loop moves on to another
  issue or the invocation ends. The worktree persists across phases, so
  committing keeps the branch's state — not an uncommitted working-tree
  diff — the source of truth for the next phase or the eventual PR. `/plan`
  needs no commit (it only writes to the gitignored `.claude/plans/` and
  posts a GitHub comment).

### 1 — Discovery order

Query with `gh issue list --label <label> --json number,title,body,labels`,
one query per label, in this priority order:

1. `agent:approved` issues — resume immediately, highest priority.
2. `agent:qa-retry` issues — continue the fix loop.
3. `agent:implementing` issues with no retry flag — a previous run likely
   died mid-phase. Treat as **recoverable, not an error**: re-run the phase's
   action from scratch (`/implement` and `/qa` run cleanly against the
   branch's current committed state; they are not resumed mid-command).
4. `ready-for-agent` issues, oldest issue number first — create a new branch.

Skip issues sitting in any `*-pending-approval` label or in `agent:blocked`
(without `agent:approved`) — they don't count against the 3-issue budget.
Stop once 3 issues have been advanced, or once no advanceable issue remains,
whichever comes first (see `HUMAN-GATES.md` for the budget as a hard limit).

### 2 — Per-phase transition table

A `*-pending-approval` label always co-exists with `agent:approved` once a
human clears it — read the **pair** together to know which phase to run next,
then remove **both** labels when done.

| Current label(s)                                 | Action (in the issue's own worktree)                                                                                                                                                                 | Next label                                                              |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `ready-for-agent`                                | Create the issue's worktree from `main` (step 0), record its actual branch name in `.agent-state.json`; run `/spec` from the issue title+body; commit the spec file; post it as a `gh issue comment` | `agent:spec-pending-approval`                                           |
| `agent:spec-pending-approval` + `agent:approved` | Enter the issue's worktree (step 0); run `/plan docs/specs/<spec>.md`; post the plan as a comment; remove both labels                                                                                | `agent:plan-pending-approval`                                           |
| `agent:plan-pending-approval` + `agent:approved` | Enter the issue's worktree (step 0); run `/implement`, then `/qa`; commit the implementation; hand off to the verifier (step 3 below); remove both labels                                            | `agent:pr-open` / `agent:qa-retry` / `agent:blocked` (verifier-decided) |
| `agent:qa-retry`                                 | Enter the issue's worktree (step 0); `/implement "fix: <qa findings>"`; commit; re-run `/qa`; hand off to the verifier again                                                                         | same branching as above                                                 |
| `agent:pr-open`                                  | Check `gh pr view --json state` — see PR outcome housekeeping below                                                                                                                                  | _(terminal, or worktree removed)_                                       |

Never advance a second gated phase for the same issue in the same
`/run-backlog` invocation — spec→plan and plan→implement are always separated
by a human-approval run boundary.

### 3 — The verifier handoff (critical)

After running `/qa` for an issue, **persist** the synthesized `## QA Report`
to `.claude/backlog-state/issue-<n>/.qa-report.md` — `/qa` only prints to the
session, so this write is the seam between the model (produces the report)
and the program (judges it). Then run:

```
scripts/verify_qa_gate.sh .claude/backlog-state/issue-<n>/.qa-report.md
```

Branch **on its exit code only** — never re-read or re-judge the report's
prose or scores in-model:

- **exit 0** → `agent:pr-open`; `gh pr create` from the branch, referencing
  the issue.
- **exit 1** → gate failed. If `qa_retries < 3` (from `.agent-state.json`):
  `agent:qa-retry`, increment `qa_retries`. If `qa_retries == 3`:
  `agent:blocked` (retries exhausted — see `HUMAN-GATES.md`).
- **exit 2** → misuse/anomaly (e.g. `/qa` crashed before producing a report).
  Always `agent:blocked`, regardless of retry count.

### 4 — State writes

On every phase advance, update together:

- `.claude/backlog-state/issue-<n>/.agent-state.json` — `{ "issue", "phase",
"qa_retries", "branch" }`. Increment `qa_retries` only on a qa-retry
  transition; every other transition leaves it unchanged (or initializes it
  to `0` on branch creation).
- The durable GitHub label(s) (`gh issue edit --add-label ... --remove-label
...`) and a `gh issue comment` explaining what happened this run.

### 5 — PR outcome housekeeping

On a run where an issue is in `agent:pr-open`, check `gh pr view --json
state`:

- **MERGED** — remove the issue's worktree with `git worktree remove <path>`
  followed by `git branch -d <branch>` (path/branch read from
  `.agent-state.json` — never assume `agent/issue-<n>`). This is the default
  method: the native `ExitWorktree(action: "remove")` tool only operates on a
  worktree created by `EnterWorktree` **in the current session**, and
  merge-cleanup almost always happens in a later, separate `/run-backlog`
  invocation than the one that created the worktree — so `ExitWorktree` is
  only usable in the rare case where the same session both opens the PR and
  is still active when it merges. Removing the worktree also disposes the
  ephemeral `.claude/backlog-state/issue-<n>/` state. The issue closes
  automatically via GitHub's "closes #n" linking.
- **CLOSED** (not merged) — leave `agent:pr-open` as-is and leave the
  worktree in place; take no further action. A human runs the worktree
  removal (same as the MERGED step) if and when they decide to abandon the
  issue.
- **OPEN** — still awaiting merge; not an advanceable issue, skip. Leave its
  worktree as-is — worktrees no longer share a directory, so there's nothing
  to switch back from.

---

## Anomalies and budget

Any anomaly (scope drift, an `infra/**` diff, an issue's worktree
already carrying unexpected uncommitted changes from an unrelated source, a
non-deterministic crash, or verifier exit 2) always routes to `agent:blocked`
— see `HUMAN-GATES.md` for the full trigger list. The
3-issues-per-run and 3-qa-retries-per-issue limits are hard stops, also
defined in `HUMAN-GATES.md` — this file only enforces them by reading
`.agent-state.json`'s counters; it does not restate the rationale.

---

## How to run

Triggered manually via `/run-backlog` — see `TRIGGER.md` for the invocation
contract. Before the first live run:

1. Run `scripts/bootstrap_labels.sh` once (human setup — creates the 8
   `agent:*` / `ready-for-agent` labels).
2. Confirm `gh auth status` shows write access to issues/labels/PRs.
3. Review `HUMAN-GATES.md` — every gate there must be understood before real
   actions begin.
4. Confirm `scripts/verify_qa_gate.sh` is executable and passes its fixture
   suite (`scripts/fixtures/`).

---

## What "done" means

There is no single "loop done" state — `backlog-runner` is a recurring,
manually-triggered sweep, not a run-to-completion job. Per issue, that issue
is done when its PR is merged (see PR outcome housekeeping) and its worktree
has been removed (and branch deleted). Per invocation, the run is done when 3
issues have been advanced or no advanceable issue remains — whichever comes
first.
