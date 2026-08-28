#!/usr/bin/env bash
# bootstrap_labels.sh — one-time GitHub label setup for the backlog-runner
# state machine.
#
# This is a HUMAN setup step, run once before the first /run-backlog
# invocation — the loop itself never creates labels. `gh issue edit
# --add-label` errors on a label that doesn't exist, so every label the
# discovery/transition logic depends on must exist first.
#
# Usage: scripts/bootstrap_labels.sh
set -euo pipefail

gh label create "ready-for-agent" \
  --description "Queued for backlog-runner; not yet picked up" \
  --force

gh label create "agent:spec-pending-approval" \
  --description "Spec drafted and posted as a comment; waiting on a human" \
  --force

gh label create "agent:plan-pending-approval" \
  --description "Plan drafted and posted as a comment; waiting on a human" \
  --force

gh label create "agent:implementing" \
  --description "Approved past plan; /implement -> /qa cycle active in the worktree" \
  --force

gh label create "agent:qa-retry" \
  --description "/qa failed the gate; a fix-and-retry pass is queued" \
  --force

gh label create "agent:pr-open" \
  --description "PR opened; final human gate is the merge itself" \
  --force

gh label create "agent:blocked" \
  --description "Escalated (anomaly or retries exhausted); needs a human look" \
  --force

gh label create "agent:approved" \
  --description "Human signal that unblocks whichever *-pending-approval phase the issue is in" \
  --force

echo "backlog-runner labels are ready."
