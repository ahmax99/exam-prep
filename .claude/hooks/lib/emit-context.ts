// Reads context text from stdin and prints the SessionStart hook JSON envelope
// that Claude Code expects. Replaces a `jq -n` call so the hook needs only `bun`.

const ctx = await Bun.stdin.text()

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: ctx
    }
  })
)
