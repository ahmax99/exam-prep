#!/usr/bin/env bash
set -euo pipefail

: "${ECR_BACKEND_URL:?ECR_BACKEND_URL is required}"
: "${ECR_FRONTEND_URL:?ECR_FRONTEND_URL is required}"
: "${AWS_REGION:?AWS_REGION is required}"

echo "==> Building backend image..."
docker build --platform linux/amd64 \
  -t "${ECR_BACKEND_URL}:latest" \
  -f apps/backend-boilerplate/Dockerfile \
  --build-arg DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/placeholder?schema=public" \
  .

echo "==> Pushing backend image..."
docker push "${ECR_BACKEND_URL}:latest"
echo "Backend pushed: ${ECR_BACKEND_URL}:latest"

echo "==> Building frontend image..."
docker build --platform linux/amd64 \
  -t "${ECR_FRONTEND_URL}:latest" \
  -f apps/nextjs-boilerplate/Dockerfile \
  .

echo "==> Pushing frontend image..."
docker push "${ECR_FRONTEND_URL}:latest"
echo "Frontend pushed: ${ECR_FRONTEND_URL}:latest"

echo "==> Both images pushed successfully."
