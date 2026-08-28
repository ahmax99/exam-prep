#!/usr/bin/env sh
export PATH="$HOME/.local/bin:$PATH"

if [ "${GRAPHIFY_RUNNING}" = "1" ]; then
  exit 0
fi

if ! command -v graphify > /dev/null 2>&1; then
  exit 0
fi

export GRAPHIFY_RUNNING=1

$HOME/.local/bin/graphify update .
