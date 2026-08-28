#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT_NAME:?PROJECT_NAME is required}"
: "${ENVIRONMENT:?ENVIRONMENT is required}"

secret_id="${PROJECT_NAME}-${ENVIRONMENT}/database-url"

if ! aws secretsmanager describe-secret --secret-id "$secret_id" >/dev/null 2>&1; then
  echo "::notice::Secret ${secret_id} does not exist — its name is already reusable."
  exit 0
fi

aws secretsmanager restore-secret --secret-id "$secret_id" >/dev/null 2>&1 || true

echo "Force-deleting ${secret_id} so a re-apply can reuse the name immediately"
aws secretsmanager delete-secret --secret-id "$secret_id" --force-delete-without-recovery >/dev/null
