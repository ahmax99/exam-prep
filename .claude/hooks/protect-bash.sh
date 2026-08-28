#!/bin/bash
# PreToolUse hook for Bash.
# Blocks shell commands that read, write, append, copy, exfiltrate, or
# otherwise expose secret-bearing files or environment variables.

HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"
COMMAND=$(bun "$HOOK_DIR/lib/json-field.ts" tool_input.command)

if [[ -z "$COMMAND" ]]; then
  exit 0
fi

# Strip .env.example / .env.sample / .env.template / .env.schema / .env.defaults
# so the .env detector below doesn't trip on them. Strip ONLY when followed by
# a terminator (whitespace, quote, redirect/pipe/separator, or end-of-string)
# so paths like ".env.example.bak" still get blocked.
SCAN=$(sed -E 's/\.env\.(example|sample|template|schema|defaults)([[:space:]>|;&)"'\'']|$)/\2/g' <<<"$COMMAND")

block_reason=""

# ----- Protected paths -------------------------------------------------------

# .env / .env.<x> / .envrc — preceded by a non-word char.
# Filters out JS-style references like `process.env` and the `dotenv` package.
if grep -qE '(^|[^A-Za-z0-9_./-])\.env(rc|\.[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)*)?([^A-Za-z0-9_./-]|$)' <<<"$SCAN"; then
  block_reason=".env / .envrc file"
fi

# <prefix>.env / <prefix>.env.<x> — bounded as a filename token.
# Required because `cat prod.env` has alphanumeric before `.env`, so the
# rule above skips it. Bounding (space/quote/redirect/start on the left,
# space/quote/redirect/separator/end on the right) keeps this from matching
# random property-access in source code, but it WILL match shell strings like
# `node -e "process.env.NODE_ENV"` — accepted trade-off, since missing real
# prefix-named env files is worse than blocking that exact incantation.
if [[ -z "$block_reason" ]] && \
   grep -qE '(^|[[:space:]"'\''<=:/])[A-Za-z0-9_-]+\.env(\.[A-Za-z0-9._-]+)*([[:space:]"'\''>|;&)]|$)' <<<"$SCAN"; then
  block_reason="<prefix>.env file"
fi

# SSH private keys
if [[ -z "$block_reason" ]] && \
   grep -qE '(^|[^A-Za-z0-9_-])id_(rsa|dsa|ecdsa|ed25519)([^A-Za-z0-9_.-]|$)' <<<"$SCAN"; then
  block_reason="SSH private key"
fi

# SSH authorized_keys / known_hosts
if [[ -z "$block_reason" ]] && \
   grep -qE '\.ssh/(authorized_keys|known_hosts)([^A-Za-z0-9_-]|$)' <<<"$SCAN"; then
  block_reason="SSH authorized_keys / known_hosts"
fi

# Key / certificate / keystore files (.pem .key .p12 .pfx .ppk .keystore .jks)
if [[ -z "$block_reason" ]] && \
   grep -qE '[A-Za-z0-9_./-]+\.(pem|key|p12|pfx|ppk|keystore|jks)([^A-Za-z0-9_-]|$)' <<<"$SCAN"; then
  block_reason="key/cert/keystore file"
fi

# Cloud credential files (basenames)
if [[ -z "$block_reason" ]] && \
   grep -qE '(^|[^A-Za-z0-9_-])(credentials\.json|service-account[A-Za-z0-9_-]*\.json)([^A-Za-z0-9_-]|$)' <<<"$SCAN"; then
  block_reason="cloud credentials file"
fi

# AWS / GCloud / Azure / Kube / Docker credential paths
if [[ -z "$block_reason" ]] && \
   grep -qE '\.aws/(credentials|config)([^A-Za-z0-9_-]|$)' <<<"$SCAN"; then
  block_reason="AWS credentials"
fi
if [[ -z "$block_reason" ]] && \
   grep -qE '\.kube/config([^A-Za-z0-9_-]|$)' <<<"$SCAN"; then
  block_reason="Kubernetes config"
fi
if [[ -z "$block_reason" ]] && \
   grep -qE '\.docker/config\.json([^A-Za-z0-9_-]|$)' <<<"$SCAN"; then
  block_reason="Docker registry auth"
fi
if [[ -z "$block_reason" ]] && \
   grep -qE '\.config/gcloud/(credentials|access_tokens|legacy_credentials)' <<<"$SCAN"; then
  block_reason="GCloud credentials"
fi
if [[ -z "$block_reason" ]] && \
   grep -qE '\.azure/(credentials|accessTokens)' <<<"$SCAN"; then
  block_reason="Azure credentials"
fi
if [[ -z "$block_reason" ]] && \
   grep -qE '\.gem/credentials([^A-Za-z0-9_-]|$)' <<<"$SCAN"; then
  block_reason="RubyGems credentials"
fi

# Auth / password dotfiles
if [[ -z "$block_reason" ]] && \
   grep -qE '(^|[/[:space:]])\.(npmrc|pypirc|netrc|pgpass|my\.cnf|vault-token|htpasswd)([^A-Za-z0-9_-]|$)' <<<"$SCAN"; then
  block_reason="auth/credential dotfile"
fi

# ----- Environment / process exfiltration patterns ---------------------------

# /proc/<pid>/environ — process environment dump
if [[ -z "$block_reason" ]] && \
   grep -qE '/proc/[^/[:space:]]+/environ' <<<"$SCAN"; then
  block_reason="/proc/*/environ (process environment dump)"
fi

# printenv (full env dump)
if [[ -z "$block_reason" ]] && \
   grep -qE '(^|[;&|][[:space:]]*|\([[:space:]]*)printenv\b' <<<"$SCAN"; then
  block_reason="printenv (full env dump)"
fi

# Bare `env` (no args -> full dump) or `env >file` / `env 2>file` redirect.
# `env VAR=val cmd` is allowed because something other than [end|pipe|;|&|>]
# follows (and `VAR=val` is not `<digits>>`).
if [[ -z "$block_reason" ]] && \
   grep -qE '(^|[;&|][[:space:]]*)env([[:space:]]*($|[;&|>])|[[:space:]]+[0-9]*>)' <<<"$SCAN"; then
  block_reason="bare \`env\` (full env dump)"
fi

# echo/printf/cat/etc. of secret-named env vars
if [[ -z "$block_reason" ]] && \
   grep -qE '\b(echo|printf|cat|less|head|tail|more|bat)\b[^;|&]*\$\{?[A-Za-z_]*(SECRET|TOKEN|PASSWORD|PASSWD|API_KEY|PRIVATE_KEY|CREDENTIAL)' <<<"$SCAN"; then
  block_reason="reading/echoing a secret env var"
fi

# ----- Final decision --------------------------------------------------------

if [[ -n "$block_reason" ]]; then
  echo "Blocked Bash command: appears to touch protected $block_reason." >&2
  echo "Command: $COMMAND" >&2
  echo "If you only need to inspect structure, use the .example/.sample variant." >&2
  exit 2
fi

exit 0
