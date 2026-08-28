#!/bin/sh
# Stop hook: blocks the turn from ending if TypeScript errors are found.
# Runs `bun run check-types` (Turbo `tsc --noEmit` across packages; cached, so
# repeat runs are cheap when nothing changed). Claude Code aborts after 8
# consecutive blocks.

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

bun run check-types 2>&1 | grep -E 'error TS|Found [^0]' && echo 'TYPE ERRORS — fix before stopping' && exit 1 || exit 0
