#!/usr/bin/env bash
set -euo pipefail

MAX_ATTEMPTS=3

run_plan() {
  terraform -chdir=infra plan -no-color -lock-timeout=300s -out=tfplan.binary
}

web_acl_will_be_destroyed() {
  terraform -chdir=infra show -json tfplan.binary |
    jq -e '[.resource_changes[]?
             | select(.type == "aws_wafv2_web_acl")
             | select(.change.actions | index("delete"))]
           | length > 0' >/dev/null
}

# Idempotent: a distribution with no ACL attached is left untouched.
detach_web_acl_from_cloudfront() {
  local distribution_id etag workdir

  distribution_id=$(terraform -chdir=infra output -raw cloudfront_distribution_id)
  workdir=$(mktemp -d)

  aws cloudfront get-distribution-config --id "$distribution_id" >"$workdir/current.json"

  if [ -z "$(jq -r '.DistributionConfig.WebACLId // ""' "$workdir/current.json")" ]; then
    return
  fi

  etag=$(jq -r '.ETag' "$workdir/current.json")
  jq '.DistributionConfig | .WebACLId = ""' "$workdir/current.json" >"$workdir/detached.json"

  echo "Detaching the WAF ACL from CloudFront ${distribution_id} so Terraform can destroy it"
  aws cloudfront update-distribution \
    --id "$distribution_id" \
    --if-match "$etag" \
    --distribution-config "file://$workdir/detached.json" >/dev/null

  # DeleteWebACL only succeeds once the disassociation has actually rolled out.
  aws cloudfront wait distribution-deployed --id "$distribution_id"
}

attempt=1
while true; do
  run_plan

  if web_acl_will_be_destroyed; then
    detach_web_acl_from_cloudfront
    run_plan
  fi

  if output=$(terraform -chdir=infra apply -auto-approve -lock-timeout=300s tfplan.binary 2>&1); then
    echo "$output"
    break
  fi

  echo "$output"

  if [ "$attempt" -ge "$MAX_ATTEMPTS" ] || ! grep -q 'WAFAssociatedItemException' <<<"$output"; then
    exit 1
  fi

  echo "WAF ACL delete still blocked by its CloudFront association — retrying in 60s (attempt ${attempt}/${MAX_ATTEMPTS})"
  sleep 60
  attempt=$((attempt + 1))
done
