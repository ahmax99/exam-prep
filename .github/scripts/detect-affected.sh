#!/bin/bash
set -euo pipefail

if [[ -z "${GITHUB_OUTPUT:-}" ]]; then
  echo "❌ Error: GITHUB_OUTPUT is not set" >&2
  exit 1
fi

BACKEND_PACKAGE="backend-boilerplate"
FRONTEND_PACKAGE="nextjs-boilerplate"

deploy_both() {
  echo "backend=true" >> "$GITHUB_OUTPUT"
  echo "frontend=true" >> "$GITHUB_OUTPUT"
}

base_usable() {
  [[ -n "${BEFORE_SHA:-}" && ! "$BEFORE_SHA" =~ ^0+$ ]] && git cat-file -e "${BEFORE_SHA}^{commit}" 2>/dev/null
}

SCOPE="${SCOPE:-}"
[[ -z "$SCOPE" ]] && SCOPE='infra-and-apps' # push events carry no scope input
case "$SCOPE" in
  infra-and-apps | infra-only | apps-only) ;;
  *)
    echo "❌ Unknown SCOPE '$SCOPE'" >&2
    exit 1
    ;;
esac

if [[ "${EVENT_NAME:-}" == 'workflow_dispatch' ]]; then
  echo "🚀 workflow_dispatch (scope=${SCOPE})"
  [[ "$SCOPE" == 'apps-only' ]] && echo "infra=false" >> "$GITHUB_OUTPUT" || echo "infra=true" >> "$GITHUB_OUTPUT"
  if [[ "$SCOPE" == 'infra-only' ]]; then
    echo "backend=false" >> "$GITHUB_OUTPUT"
    echo "frontend=false" >> "$GITHUB_OUTPUT"
  else
    deploy_both
  fi
  exit 0
fi

if [[ "${EVENT_NAME:-}" != "push" || "${REF_TYPE:-}" == "tag" ]]; then
  echo "🚀 ${EVENT_NAME:-unknown} on ${REF_TYPE:-unknown}: deploying both apps."
  echo "infra=false" >> "$GITHUB_OUTPUT"
  deploy_both
  exit 0
fi

infra_changed() {
  if ! base_usable; then
    echo "true" # fail safe, same reasoning as deploy_both below
  elif git diff --name-only "$BEFORE_SHA" "$HEAD_SHA" -- infra/ | grep -q .; then
    echo "true"
  else
    echo "false"
  fi
}
echo "infra=$(infra_changed)" >> "$GITHUB_OUTPUT"

# Fail safe: no usable base (first push or force-push) => deploy both.
if ! base_usable; then
  echo "⚠️  Base commit '${BEFORE_SHA:-}' unavailable; deploying both apps (fail-safe)."
  deploy_both
  exit 0
fi

echo "🔍 Computing affected packages between $BEFORE_SHA and $HEAD_SHA"
affected="$(TURBO_SCM_BASE="$BEFORE_SHA" TURBO_SCM_HEAD="$HEAD_SHA" \
  bunx turbo ls --affected --output=json \
  | jq -r '.packages.items[].name')"

if [[ -z "$affected" ]]; then
  echo "✅ No affected packages; skipping deployment."
  echo "backend=false" >> "$GITHUB_OUTPUT"
  echo "frontend=false" >> "$GITHUB_OUTPUT"
  exit 0
fi

echo "Affected packages:"
echo "$affected"

if echo "$affected" | grep -qx "$BACKEND_PACKAGE"; then
  echo "backend=true" >> "$GITHUB_OUTPUT"
else
  echo "backend=false" >> "$GITHUB_OUTPUT"
fi

if echo "$affected" | grep -qx "$FRONTEND_PACKAGE"; then
  echo "frontend=true" >> "$GITHUB_OUTPUT"
else
  echo "frontend=false" >> "$GITHUB_OUTPUT"
fi
