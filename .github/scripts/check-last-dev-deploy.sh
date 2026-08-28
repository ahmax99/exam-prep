#!/usr/bin/env bash
set -euo pipefail

: "${GH_TOKEN:?GH_TOKEN is required}"
: "${REPO:?REPO is required}"
: "${REQUIRE_BACKEND:?REQUIRE_BACKEND is required}"   # "true"/"false"
: "${REQUIRE_FRONTEND:?REQUIRE_FRONTEND is required}" # "true"/"false"

check_job() {
  local job_name="$1"
  local runs
  runs=$(gh run list --repo "$REPO" --workflow=deploy.yml --branch main --event push \
    --status completed --limit 20 --json databaseId --jq '.[].databaseId')

  for run_id in $runs; do
    local conclusion
    conclusion=$(JOB_NAME="$job_name" gh run view "$run_id" --repo "$REPO" --json jobs \
      --jq '.jobs[] | select(.name == env.JOB_NAME) | .conclusion' | head -1)

    if [[ -n "$conclusion" && "$conclusion" != "skipped" && "$conclusion" != "cancelled" ]]; then
      if [[ "$conclusion" == "success" ]]; then
        echo "✅ Most recent '${job_name}' run (id ${run_id}) succeeded."
        return 0
      fi
      echo "::error::Most recent '${job_name}' run (id ${run_id}) concluded '${conclusion}', not 'success'. Dev looks broken — investigate before releasing."
      return 1
    fi
  done

  echo "⚠️  No completed '${job_name}' run found in the last 20 deploy.yml runs on main; nothing to verify against, proceeding."
  return 0
}

STATUS=0
[[ "$REQUIRE_BACKEND" == "true" ]] && { check_job "Deploy Backend → Dev" || STATUS=1; }
[[ "$REQUIRE_FRONTEND" == "true" ]] && { check_job "Deploy Frontend → Dev" || STATUS=1; }

exit "$STATUS"
