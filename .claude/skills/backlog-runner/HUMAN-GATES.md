# backlog-runner — Human Gates & Budget

> A loop without human gates can act in ways no one intended.
> A loop without a budget can run forever. Both sections below are required.
> Do not mark the loop scaffolded if either is incomplete.

---

## Human gates

The following actions require explicit human approval before the loop
proceeds. The loop halts at each gate and waits for a clear "go" — it never
self-approves.

| #   | Gate                           | Trigger condition                        | Who approves        | Clearance signal                                                    |
| --- | ------------------------------ | ---------------------------------------- | ------------------- | ------------------------------------------------------------------- |
| G1  | Pre-implement (first live run) | Plan posted as a comment on the issue    | Loop owner          | Add the `agent:approved` label                                      |
| G0  | Pre-plan                       | Spec posted as a comment on the issue    | Loop owner          | Add the `agent:approved` label                                      |
| G2  | Anomaly                        | Any of the four anomaly conditions below | Loop owner          | Manual: remove `agent:blocked` after fixing/deciding, then re-queue |
| G3  | Merge                          | PR opened by the loop                    | Designated reviewer | Merge or close the PR yourself — the loop never merges              |

G0 and G1 both clear on the same signal (`agent:approved`), but at different
points in the pipeline: G0 gates `/plan` running at all (nothing has been
written to code yet); G1 gates `/implement` running (the first step that
actually writes code) — this is the loop-maker-mandated "gate before the
first real run." G2 is loop-maker's mandated anomaly gate. G3 is this loop's
non-negotiable: it never merges its own work.

### Anomaly gate (G2) — trigger conditions

Any of the following routes the issue to `agent:blocked`, removes the
in-progress phase label, and posts a comment naming which condition tripped:

1. `scripts/verify_qa_gate.sh` still exits 1 after 3 qa-retry cycles (see
   Budget below).
2. The branch's diff touches `infra/**` — **always** blocked
   regardless of the QA gate's result, per `.claude/rules/infra.md`'s
   existing rule against unattended infrastructure state changes.
3. Scope drift — the branch's `git diff --stat` touches files not named in
   the plan's "Files to modify/create" list or acceptance criteria.
4. Any non-deterministic failure — a crash, a tool error, or
   `scripts/verify_qa_gate.sh` exiting 2 (misuse/anomaly, distinct from a
   normal exit-1 gate fail). Never silently retried.
5. A pre-existing worktree for the issue contains unexpected uncommitted
   changes from an unrelated source (not this loop's own committed phase
   output) — never silently stashed or discarded; block for human
   inspection. This is the residual, worktree-scoped equivalent of the old
   shared-directory version of this condition, which is now structurally
   impossible: each issue has its own isolated worktree, so one issue's
   uncommitted edits can no longer be at risk from another issue's checkout.

### How to clear a gate

- **G0 / G1** — the loop posts the spec or plan as an issue comment. A human
  reviews it and adds the `agent:approved` label. The loop reads the
  `*-pending-approval` label + `agent:approved` pair together on its next
  invocation, acts, and removes both.
- **G2** — a human reads the `agent:blocked` comment, resolves the underlying
  issue (fixes the code, decides to abandon, or manually intervenes), removes
  `agent:blocked`, and re-applies whichever label lets discovery pick the
  issue back up.
- **G3** — a human merges or closes the PR directly on GitHub. The loop takes
  no merge action ever; see the SKILL's PR outcome housekeeping for what it
  does _after_ a human has already merged or closed.

Never self-approve. The loop must not treat its own `/qa` output, or any of
its own generated content, as a gate clearance — only an explicit
human-applied label or a human merge/close action clears a gate.

---

## Budget / stop

These limits are **hard stops**, not suggestions.

| Dimension                                     | Limit                 | Action on breach                                                                                    |
| --------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------- |
| Issues advanced per `/run-backlog` invocation | 3                     | Stop the invocation; issues in `*-pending-approval` or `agent:blocked` don't count against this cap |
| QA-retry cycles per issue                     | 3                     | 4th consecutive gate failure → `agent:blocked` (anomaly gate G2), not a 4th retry                   |
| Wall-clock / cost cap                         | **None — deliberate** | N/A                                                                                                 |

The absence of a wall-clock or cost cap is an intentional design choice, not
an unset blank: throughput is already bounded by the 3-issues-per-run cap and
by how quickly a human clears G0/G1/G3. Adding a time box on top would not
change observed behavior in practice, only add a limit that could fire
before those other bounds ever do.

### Why a hard stop is required

`backlog-runner` cold-starts on every `/run-backlog` invocation with no
inherent awareness of how many issues it has already advanced today. The
3-issue cap and the 3-qa-retry cap are read from `.agent-state.json` (per
issue) and from the discovery query's result count (per invocation) — both
persist across cold starts, so nothing depends on an in-memory counter that
would reset if the loop were interrupted mid-run.

---

## Why state is split two ways

Durable queue state (which phase an issue is in) lives on the GitHub issue
itself as labels + comments — visible to the whole team, and a checkable
predicate rather than parsed prose. Ephemeral per-issue state (the
`qa_retries` counter, the branch name) lives in
`.claude/backlog-state/issue-<n>/.agent-state.json` in the issue's own
worktree — it is created when the worktree is created and disposed when the
worktree is removed after merge, so there is never a stale counter left over
to reset by hand. See `SKILL.md`'s Conventions section for the full
rationale, and commit `7d99155` (#73) for the original design — the design
plan itself lives under the gitignored `.claude/plans/**`, so it isn't a
committed, team-visible artifact.
