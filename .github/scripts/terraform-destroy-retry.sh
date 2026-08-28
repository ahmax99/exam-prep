#!/usr/bin/env bash
set -euo pipefail

MAX_ATTEMPTS=3
SLEEP_SECONDS=600

attempt=1
while true; do
  if terraform -chdir=infra destroy -auto-approve -no-color -lock-timeout=300s; then
    echo "Terraform destroy completed on attempt ${attempt}."
    break
  fi

  if [ "$attempt" -ge "$MAX_ATTEMPTS" ]; then
    echo "::error::terraform destroy failed ${MAX_ATTEMPTS} times. The state is partially emptied, not wedged — re-dispatch the Destroy Infrastructure workflow to resume from where this run stopped."
    exit 1
  fi

  echo "::warning::terraform destroy failed (attempt ${attempt}/${MAX_ATTEMPTS}) — retrying in ${SLEEP_SECONDS}s. Lambda@Edge replicas can hold their functions for up to 90 minutes."
  sleep "$SLEEP_SECONDS"
  attempt=$((attempt + 1))
done
