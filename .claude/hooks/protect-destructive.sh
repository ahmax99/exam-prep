#!/bin/bash
# PreToolUse hook for Bash.
# Blocks shell commands that are catastrophic or high-risk: wholesale
# filesystem deletion, disk overwrites, fork bombs, pipe-to-shell RCE,
# destructive git ops, and similar.

HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"
COMMAND=$(bun "$HOOK_DIR/lib/json-field.ts" tool_input.command)

if [[ -z "$COMMAND" ]]; then
  exit 0
fi

# Strip --force-with-lease so the force-push check doesn't false-positive.
SCAN=$(sed -E 's/--force-with-lease(=[^[:space:]]+)?//g' <<<"$COMMAND")

block_reason=""

check() {
  local re="$1" reason="$2"
  if [[ -z "$block_reason" ]] && grep -qE "$re" <<<"$SCAN"; then
    block_reason="$reason"
  fi
}

# ----- Catastrophic filesystem ops -------------------------------------------

# rm -rf ~ / $HOME / / / system dirs / current-dir-contents
RM_FLAGS='(-[a-zA-Z]*[rRf][a-zA-Z]*[[:space:]]+)+'
check "\brm[[:space:]]+${RM_FLAGS}[\"']?~/?[\"']?([[:space:]]|\$|[;&|])"                 'rm targeting home directory (~)'
check "\brm[[:space:]]+${RM_FLAGS}[\"']?\\\$HOME[\"']?([[:space:]]|\$|[;&|])"            'rm targeting $HOME'
check "\brm[[:space:]]+${RM_FLAGS}/(\\*|[[:space:]]|\$|[;&|])"                           'rm targeting filesystem root (/)'
check "\brm[[:space:]]+${RM_FLAGS}/(etc|usr|var|bin|sbin|lib|boot|dev|proc|sys|root|home|opt|srv)(/|[[:space:]]|\$)" 'rm targeting system directory'
check "\brm[[:space:]]+${RM_FLAGS}(\\./?\\*?|\\*)([[:space:]]|\$|[;&|])"                 'rm deleting current directory contents'

# Disk overwrite / format
check '\bdd\b[^|;&]*\b[oO][fF]=/dev/(sd[a-z]|nvme[0-9]|hd[a-z]|vd[a-z]|xvd[a-z])'        'dd writing to a disk device'
check '\bmkfs(\.[a-z0-9]+)?[[:space:]]+/dev/(sd[a-z]|nvme[0-9]|hd[a-z]|vd[a-z])'         'mkfs formatting a disk'

# Fork bomb: :(){ :|: & };:  (also matches the same idiom with extra whitespace)
check ':[[:space:]]*\([[:space:]]*\)[[:space:]]*\{[^}]*:[[:space:]]*\|[[:space:]]*:.*&'   'fork bomb'

# ----- Remote-code-execution patterns ----------------------------------------

# curl/wget piped to a shell
check '\b(curl|wget)\b.*\|[[:space:]]*(ba|z|k|d)?sh\b'                                   'piping a downloaded URL to a shell (RCE risk)'

# ----- Destructive git ops ---------------------------------------------------

# Force push to main/master (--force-with-lease already stripped above).
# Decomposed so the rule fires regardless of token order
# (e.g. `git push origin main --force` had `main` before `--force`).
if [[ -z "$block_reason" ]] \
   && grep -qE '\bgit\b[^;&|]*\bpush\b' <<<"$SCAN" \
   && grep -qE '(--force\b|[[:space:]]-[a-zA-Z]*f\b)' <<<"$SCAN" \
   && grep -qE '\b(main|master)\b' <<<"$SCAN"; then
  block_reason="force push to main/master"
fi

# Use `\bgit\b[^;&|]*\bSUBCMD\b` so flag prefixes like `git -C dir`,
# `git --no-pager`, `git -c k=v` don't bypass the rule.
check '\bgit\b[^;&|]*\breset[[:space:]]+--hard\b'                                        'git reset --hard discards uncommitted work'
check '\bgit\b[^;&|]*\bclean[[:space:]]+(-[a-zA-Z]*f|--force)'                           'git clean -f deletes untracked files'
check '\bgit\b[^;&|]*\bcheckout[[:space:]]+\.([[:space:]]|$|[;&|])'                      'git checkout . discards local changes'
check '\bgit\b[^;&|]*\brestore[[:space:]]+\.([[:space:]]|$|[;&|])'                       'git restore . discards local changes'

# ----- Privilege / permission risks ------------------------------------------

check '\bchmod\b[^|;&]*\b[0-7]?777\b'                                                    'chmod 777 (world-writable, incl. sticky/setuid/setgid variants)'
check '\bsudo[[:space:]]+rm\b'                                                           'sudo rm (elevated deletion)'

# ----- Docker / container destructive ops ------------------------------------

check '\bdocker[[:space:]]+volume[[:space:]]+(rm|prune)\b'                               'docker volume deletion (data loss)'
check '\bdocker[[:space:]]+(system|image)[[:space:]]+prune\b'                            'docker prune removes images/data'

# ----- Cron -----------------------------------------------------------------

check '\bcrontab[[:space:]]+-r\b'                                                        'crontab -r removes all cron jobs'

# ----- Final decision --------------------------------------------------------

if [[ -n "$block_reason" ]]; then
  echo "Blocked destructive command: $block_reason." >&2
  echo "Command: $COMMAND" >&2
  echo "If this is intentional, run it manually outside Claude Code." >&2
  exit 2
fi

exit 0
