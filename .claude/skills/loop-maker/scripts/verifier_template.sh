#!/usr/bin/env bash
set -euo pipefail
if [ "$#" -lt 2 ]; then
  echo "usage: $0 \"<description>\" <predicate-command> [args...]" >&2
  exit 2
fi
description="$1"; shift
if "$@"; then
  echo "PASS: $description"; exit 0
else
  status=$?
  echo "FAIL: $description (predicate exited $status)" >&2; exit 1
fi
