#!/bin/bash
# PostToolUse hook for Edit|Write.
# Auto-formats the edited file with oxfmt + oxlint (the repo's linter+formatter).
# Always exits 0 — formatting must never block an edit from completing.

INPUT=$(cat)
HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"
FILE_PATH=$(bun "$HOOK_DIR/lib/json-field.ts" tool_input.file_path <<<"$INPUT")

[[ -z "$FILE_PATH" ]] && exit 0
[[ ! -f "$FILE_PATH" ]] && exit 0

# oxfmt silently skips unknown extensions, matching Biome's ignore-unknown behavior.
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
bunx oxfmt "$FILE_PATH" >/dev/null 2>&1
bunx oxlint --fix --no-error-on-unmatched-pattern "$FILE_PATH" >/dev/null 2>&1

exit 0
