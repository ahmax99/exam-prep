#!/usr/bin/env bash
set -euo pipefail

: "${AWS_REGION:?AWS_REGION is required}"

echo "==> Running full Terraform apply..."
terraform -chdir=infra apply \
  -auto-approve \
  -lock-timeout=300s

echo "==> Publishing Lambda versions and updating aliases..."
BACKEND_FN=$(terraform -chdir=infra output -raw backend_function_name)
BACKEND_ALIAS=$(terraform -chdir=infra output -raw backend_alias_name)
FRONTEND_FN=$(terraform -chdir=infra output -raw frontend_function_name)
FRONTEND_ALIAS=$(terraform -chdir=infra output -raw frontend_alias_name)

for pair in "backend:$BACKEND_FN:$BACKEND_ALIAS" "frontend:$FRONTEND_FN:$FRONTEND_ALIAS"; do
  APP=$(echo "$pair" | cut -d: -f1)
  FN=$(echo "$pair" | cut -d: -f2)
  ALIAS=$(echo "$pair" | cut -d: -f3)
  echo "==> Publishing $APP Lambda version..."
  VERSION=$(aws lambda publish-version \
    --function-name "$FN" \
    --description "Bootstrap via CI" \
    --output json | jq -r '.Version')
  echo "==> Updating $APP alias '$ALIAS' → version $VERSION..."
  aws lambda update-alias \
    --function-name "$FN" \
    --name "$ALIAS" \
    --function-version "$VERSION" \
    --output json > /dev/null
  echo "$APP alias updated to version $VERSION"
done
