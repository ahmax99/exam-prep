#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT_NAME:?PROJECT_NAME is required}"
: "${ENVIRONMENT:?ENVIRONMENT is required}"

pool_name="${PROJECT_NAME}-${ENVIRONMENT}-user-pool"

pool_id=$(aws cognito-idp list-user-pools --max-results 60 \
  --query "UserPools[?Name=='${pool_name}'].Id | [0]" --output text)

if [ -z "$pool_id" ] || [ "$pool_id" = "None" ]; then
  echo "::notice::No Cognito user pool named '${pool_name}' — already gone, nothing to unprotect."
  exit 0
fi

echo "Disabling deletion protection on Cognito user pool ${pool_id} (${pool_name})"
aws cognito-idp update-user-pool --user-pool-id "$pool_id" --deletion-protection INACTIVE
