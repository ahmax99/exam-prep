#!/usr/bin/env bash
set -euo pipefail

: "${ENVIRONMENT:?ENVIRONMENT is required}"

mapfile -t buckets < <(
  terraform -chdir=infra show -json |
    jq -r '[.values.root_module | recurse(.child_modules[]?) | .resources[]?
              | select(.type == "aws_s3_bucket") | .values.bucket] | unique | .[]'
)

if [ "${#buckets[@]}" -eq 0 ]; then
  echo "::notice::No S3 buckets in Terraform state — nothing to purge."
  exit 0
fi

state_bucket=$(sed -n 's/^ *bucket *= *"\([^"]*\)".*/\1/p' "infra/backends/${ENVIRONMENT}.hcl")
: "${state_bucket:?no bucket found in infra/backends/${ENVIRONMENT}.hcl}"

purge_bucket() {
  local bucket="$1" payload

  if ! aws s3api head-bucket --bucket "$bucket" >/dev/null 2>&1; then
    echo "::notice::Bucket ${bucket} does not exist — nothing to purge."
    return 0
  fi

  echo "Purging ${bucket} (object versions and delete markers)"
  while true; do
    payload=$(aws s3api list-object-versions --bucket "$bucket" --max-items 500 --output json |
      jq -c '[(.Versions // [])[], (.DeleteMarkers // [])[] | {Key, VersionId}]
               | select(length > 0) | {Objects: ., Quiet: true}')

    [ -z "$payload" ] && break

    aws s3api delete-objects --bucket "$bucket" --delete "$payload" >/dev/null
  done
}

echo "Purging ${#buckets[@]} managed bucket(s): ${buckets[*]}"

for bucket in "${buckets[@]}"; do
  if [ "$bucket" = "$state_bucket" ]; then
    echo "::warning::Refusing to purge the Terraform state bucket ${bucket}."
    continue
  fi
  purge_bucket "$bucket"
done
