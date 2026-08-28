#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: verify_qa_gate.sh <qa-report-file>" >&2
  exit 2
fi

qa_file="$1"

if [ ! -s "$qa_file" ]; then
  echo "verify_qa_gate.sh: '$qa_file' does not exist or is empty" >&2
  exit 2
fi

# --- Score gate ----------------------------------------------------------
# Scope to the "### Scores" block only, so a stray "3/5" in issue prose or
# the acceptance-criteria table can't trip (or mask) this check.
scores_block=$(awk '/^### Scores/{f=1;next} /^###/{f=0} f' "$qa_file")
scores=$(printf '%s\n' "$scores_block" | grep -oE '[0-9]/5' | cut -d/ -f1 || true)

if [ -z "$scores" ]; then
  # No "### Scores" section, or no "X/5" lines in it — a crashed or
  # INCOMPLETE /qa run must never pass the gate. Fail closed.
  echo "verify_qa_gate.sh: no scores found in '$qa_file' — failing closed" >&2
  exit 1
fi

# Intentionally stricter than /qa's own APPROVE rule (all scores >=3, see
# qa.md "Verdict rules"). This unattended loop demands a higher bar than an
# attended human review — do not relax this to "match" qa.md's threshold.
if printf '%s\n' "$scores" | grep -qE '^[1-3]$'; then
  echo "verify_qa_gate.sh: a score below 4/5 was found in '$qa_file'" >&2
  exit 1
fi

# --- Acceptance-criteria gate ---------------------------------------------
# Scope to the acceptance-criteria table block only (between "### Acceptance
# criteria" and the next level-3 heading), so the words FAIL/UNVERIFIABLE
# appearing in issue prose under "### Issues" can't false-positive.
ac_block=$(awk '/^### Acceptance criteria/{f=1;next} /^###/{f=0} f' "$qa_file")

if printf '%s\n' "$ac_block" | grep -qiE '\|\s*(FAIL|UNVERIFIABLE)\s*\|'; then
  echo "verify_qa_gate.sh: a FAIL or UNVERIFIABLE acceptance row was found in '$qa_file'" >&2
  exit 1
fi

exit 0
