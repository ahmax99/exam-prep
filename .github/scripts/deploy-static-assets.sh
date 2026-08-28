#!/bin/bash
set -e

if [[ -z "$IMAGE_URI" ]] || [[ -z "$STATIC_ASSETS_BUCKET" ]] || [[ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]] || [[ -z "$AWS_REGION" ]]; then
  echo "❌ Error: Missing required environment variables" >&2
  echo "Required: IMAGE_URI, STATIC_ASSETS_BUCKET, CLOUDFRONT_DISTRIBUTION_ID, AWS_REGION" >&2
  exit 1
fi

echo "📦 Extracting Next.js static assets from Docker image"
echo "Image: $IMAGE_URI"
echo "Bucket: $STATIC_ASSETS_BUCKET"
echo "Distribution: $CLOUDFRONT_DISTRIBUTION_ID"

CONTAINER_NAME="nextjs-extract-$$"

cleanup() {
  docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
}
trap cleanup EXIT

docker create --name "$CONTAINER_NAME" "$IMAGE_URI"
mkdir -p .next
docker cp "$CONTAINER_NAME":/app/apps/nextjs-boilerplate/.next/static .next/static
docker cp "$CONTAINER_NAME":/app/apps/nextjs-boilerplate/public public

echo "⬆️  Uploading /_next/static/* (immutable hashed assets)..."
aws s3 sync .next/static/ "s3://${STATIC_ASSETS_BUCKET}/_next/static/" \
  --cache-control "public, max-age=31536000, immutable" \
  --region "$AWS_REGION"

echo "⬆️  Uploading /static/* (public assets)..."
aws s3 sync public/ "s3://${STATIC_ASSETS_BUCKET}/static/" \
  --cache-control "public, max-age=604800" \
  --region "$AWS_REGION"

echo "🔄 Invalidating CloudFront cache..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)

echo "✅ Static assets deployed successfully!"
echo "✅ CloudFront invalidation created: $INVALIDATION_ID"

if [[ -n "$GITHUB_OUTPUT" ]]; then
  echo "invalidation-id=$INVALIDATION_ID" >> "$GITHUB_OUTPUT"
fi
