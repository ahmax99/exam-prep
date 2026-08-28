#!/usr/bin/env bash
set -euo pipefail
if [ "$#" -ne 1 ]; then echo "usage: $0 <remaining-count>" >&2; exit 2; fi
[ "$1" -eq 0 ] 2>/dev/null && { echo "PASS: 0 items left"; exit 0; }
echo "FAIL: $1 items still open" >&2; exit 1
