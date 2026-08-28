#!/bin/bash
# PreToolUse hook for Read|Edit|Write.
# 1. Blocks reads/edits of files that commonly contain secrets.
# 2. Blocks writes whose content contains a known secret token format.

INPUT=$(cat)
HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"

FILE_PATH=$(bun "$HOOK_DIR/lib/json-field.ts" tool_input.file_path <<<"$INPUT")
NEW_CONTENT=$(bun "$HOOK_DIR/lib/json-field.ts" tool_input.content tool_input.new_string <<<"$INPUT")
BASENAME=$(basename "$FILE_PATH" 2>/dev/null)

# ----- (1) Filename-based blocks ---------------------------------------------

block_reason=""

is_allowlisted_env() {
  case "$1" in
    *.env.example|*.env.sample|*.env.template|*.env.schema|*.env.defaults) return 0 ;;
    *) return 1 ;;
  esac
}

# .env / .env.<x> / .env-<x> / .env_<x> / env.<x> / <prefix>.env(.<x>)*   (with allowlist)
if [[ "$BASENAME" =~ ^([A-Za-z0-9_-]+\.env(\.[A-Za-z0-9._-]+)*|\.env([-_.][A-Za-z0-9._-]*)?|env\.[A-Za-z0-9._-]+)$ ]]; then
  if ! is_allowlisted_env "$FILE_PATH"; then
    block_reason="$FILE_PATH may contain secrets. Use .env.example instead."
  fi
fi

# .envrc (direnv)
if [[ -z "$block_reason" ]]; then
  case "$BASENAME" in
    .envrc) block_reason="$FILE_PATH is a direnv config and typically contains secrets." ;;
  esac
fi

# SSH private keys
if [[ -z "$block_reason" ]]; then
  case "$BASENAME" in
    id_rsa|id_dsa|id_ecdsa|id_ed25519)
      block_reason="$FILE_PATH is an SSH private key."
      ;;
  esac
fi

# SSH authorized_keys / known_hosts (infrastructure disclosure)
if [[ -z "$block_reason" ]]; then
  case "$FILE_PATH" in
    */.ssh/authorized_keys|.ssh/authorized_keys)
      block_reason="$FILE_PATH controls SSH access."
      ;;
    */.ssh/known_hosts|.ssh/known_hosts)
      block_reason="$FILE_PATH reveals infrastructure topology."
      ;;
  esac
fi

# Key / certificate files
if [[ -z "$block_reason" ]]; then
  case "$FILE_PATH" in
    *.pem|*.key|*.p12|*.pfx|*.ppk|*.keystore|*.jks)
      block_reason="$FILE_PATH is a key/certificate/keystore file."
      ;;
  esac
fi

# Cloud credential files
if [[ -z "$block_reason" ]]; then
  case "$BASENAME" in
    credentials.json|service-account*.json)
      block_reason="$FILE_PATH appears to be cloud credentials."
      ;;
  esac
fi
if [[ -z "$block_reason" ]]; then
  case "$FILE_PATH" in
    */.aws/credentials|*/.aws/config|.aws/credentials|.aws/config)
      block_reason="$FILE_PATH is an AWS credentials file."
      ;;
    */.kube/config|.kube/config)
      block_reason="$FILE_PATH is a Kubernetes config with cluster credentials."
      ;;
    */.docker/config.json|.docker/config.json)
      block_reason="$FILE_PATH may contain Docker registry auth tokens."
      ;;
    */.config/gcloud/credentials*|*/.config/gcloud/access_tokens*|*/.config/gcloud/legacy_credentials/*)
      block_reason="$FILE_PATH is a GCloud credentials file."
      ;;
    */.azure/credentials|*/.azure/accessTokens*|.azure/credentials|.azure/accessTokens*)
      block_reason="$FILE_PATH is an Azure credentials file."
      ;;
    */.gem/credentials|.gem/credentials)
      block_reason="$FILE_PATH is a RubyGems credentials file."
      ;;
  esac
fi

# Auth dotfiles / password stores
if [[ -z "$block_reason" ]]; then
  case "$BASENAME" in
    .npmrc|.pypirc|.netrc|.pgpass|.my.cnf|.vault-token|vault-token|.htpasswd|htpasswd)
      block_reason="$FILE_PATH is an auth/credential dotfile."
      ;;
  esac
fi

if [[ -n "$block_reason" ]]; then
  echo "Blocked: $block_reason" >&2
  exit 2
fi

# ----- (2) Content-based secret scanning -------------------------------------
# Runs for every Edit/Write regardless of file name. Catches secrets being
# pasted into otherwise-normal source files (the real exfiltration risk).
# Skipped for Read (no content).

if [[ -n "$NEW_CONTENT" ]]; then
  secret_kind=""

  match() {
    grep -qE "$@" <<<"$NEW_CONTENT"
  }

  if   match 'AKIA[0-9A-Z]{16}';                          then secret_kind="AWS access key ID"
  elif match 'gh[poursr]_[A-Za-z0-9]{20,}';               then secret_kind="GitHub token"
  elif match 'xox[baprs]-[A-Za-z0-9-]{10,}';              then secret_kind="Slack token"
  elif match 'AIza[0-9A-Za-z_-]{35}';                     then secret_kind="Google API key"
  elif match '(sk|rk)_(live|test)_[0-9a-zA-Z]{20,}';      then secret_kind="Stripe key"
  elif match -e '-----BEGIN [A-Z ]*PRIVATE KEY-----';     then secret_kind="PEM private key block"
  fi

  if [[ -n "$secret_kind" ]]; then
    echo "Blocked: content appears to contain a $secret_kind." >&2
    echo "File: $FILE_PATH" >&2
    echo "Remove the literal value (use an env var or placeholder) and retry." >&2
    exit 2
  fi
fi

exit 0
