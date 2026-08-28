#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT_NAME:?PROJECT_NAME is required}"
: "${ENVIRONMENT:?ENVIRONMENT is required}"
: "${AWS_REGION:?AWS_REGION is required}"
: "${CENTRAL_ECR_ACCOUNT_ID:?CENTRAL_ECR_ACCOUNT_ID is required}"

BACKEND_REPO="$PROJECT_NAME-backend"
FRONTEND_REPO="$PROJECT_NAME-frontend"

has_latest() {
  local repo="$1" out err rc=0
  err="$(mktemp)"
  out="$(aws ecr batch-get-image \
    --registry-id "$CENTRAL_ECR_ACCOUNT_ID" \
    --repository-name "$repo" \
    --image-ids imageTag=latest \
    --region "$AWS_REGION" \
    --query 'images[0].imageId.imageTag' \
    --output text 2>"$err")" || rc=$?

  if [ "$rc" -eq 0 ]; then
    rm -f "$err"
    [ "$out" = "latest" ] # empty repo → "None" → absent
    return
  fi

  if grep -q 'ImageNotFoundException\|RepositoryNotFoundException' "$err"; then
    rm -f "$err"
    return 1
  fi

  echo "ERROR: cannot read central ECR repo '$repo' (not an image-absent condition):" >&2
  cat "$err" >&2
  rm -f "$err"
  exit 1
}

images="present"
has_latest "$BACKEND_REPO" || images="absent"
has_latest "$FRONTEND_REPO" || images="absent"

env_state="existing"
if ! aws lambda get-function \
       --function-name "$PROJECT_NAME-$ENVIRONMENT-backend" \
       --region "$AWS_REGION" \
       --output json > /dev/null 2>&1; then
  env_state="fresh"
fi

if [ "$images" = "absent" ] || [ "$env_state" = "fresh" ]; then
  MODE="bootstrap"
else
  MODE="steady-state"
fi

{
  echo "mode=$MODE"
  echo "images=$images"
} >> "$GITHUB_OUTPUT"
echo "ECR check: images=$images env=$env_state → $MODE"
