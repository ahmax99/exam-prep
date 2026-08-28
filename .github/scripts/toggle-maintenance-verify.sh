#!/usr/bin/env bash
set -euo pipefail

: "${ENVIRONMENT:?ENVIRONMENT is required}"
: "${ENABLED:?ENABLED is required}"
: "${PROJECT_NAME:?PROJECT_NAME is required}"
: "${ROOT_DOMAIN:?ROOT_DOMAIN is required}"
: "${DISTRIBUTION_ID:?DISTRIBUTION_ID is required}"

if [ "$ENVIRONMENT" = "prod" ]; then
  domain="${PROJECT_NAME}.${ROOT_DOMAIN}"
else
  domain="${PROJECT_NAME}.${ENVIRONMENT}.${ROOT_DOMAIN}"
fi

aws cloudfront wait distribution-deployed --id "$DISTRIBUTION_ID"

if [ "$ENABLED" = "true" ]; then
  paths=("/" "/some/deep/link" "/api/v1/posts")
else
  paths=("/" "/api/v1/posts")
fi

for path in "${paths[@]}"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "https://${domain}${path}")
  echo "GET ${path} → ${code}"
  if [ "$code" != "200" ]; then
    echo "::error::Expected 200 on ${path} (maintenance=${ENABLED}), got ${code}"
    exit 1
  fi
done
