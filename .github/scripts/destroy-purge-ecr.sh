#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT_NAME:?PROJECT_NAME is required}"
: "${REGISTRY_ID:?REGISTRY_ID is required}"

MAX_ROUNDS=100

REPOSITORIES=("${PROJECT_NAME}-backend" "${PROJECT_NAME}-frontend")

purge_repository() {
  local repo="$1" ids result unexpected round=1

  if ! aws ecr describe-repositories --repository-names "$repo" \
    --registry-id "$REGISTRY_ID" >/dev/null 2>&1; then
    echo "::notice::ECR repository ${repo} does not exist in registry ${REGISTRY_ID} — nothing to purge."
    return 0
  fi

  echo "Purging images from ${repo} (registry ${REGISTRY_ID})"
  while [ "$round" -le "$MAX_ROUNDS" ]; do
    ids=$(aws ecr list-images --repository-name "$repo" --registry-id "$REGISTRY_ID" \
      --max-items 100 --query 'imageIds[*]' --output json)

    if [ "$(jq -r 'length' <<<"$ids")" -eq 0 ]; then
      echo "${repo} is empty."
      return 0
    fi

    result=$(aws ecr batch-delete-image --repository-name "$repo" --registry-id "$REGISTRY_ID" \
      --image-ids "$ids" --output json)

    unexpected=$(jq -c '[.failures[]? | select(.failureCode != "ImageNotFound")]' <<<"$result")
    if [ "$(jq -r 'length' <<<"$unexpected")" -ne 0 ]; then
      echo "::error::batch-delete-image reported unexpected failures for ${repo}: ${unexpected}"
      exit 1
    fi

    round=$((round + 1))
  done

  echo "::error::${repo} still lists images after ${MAX_ROUNDS} delete rounds — aborting rather than looping."
  exit 1
}

for repo in "${REPOSITORIES[@]}"; do
  purge_repository "$repo"
done
