// Reads a JSON object from stdin and prints the value at the first dot-path
// argument that resolves to a non-empty value. Used by the hook scripts so they
// depend only on `bun` (already required by this repo) instead of `jq`.
//
// Usage: bun json-field.ts tool_input.command
//        bun json-field.ts tool_input.content tool_input.new_string

const paths = process.argv.slice(2).map((p) => p.split('.').filter(Boolean))

let input: unknown
try {
  input = JSON.parse(await Bun.stdin.text())
} catch {
  input = undefined
}

const get = (root: unknown, keys: string[]): unknown => {
  let value = root
  for (const key of keys) {
    if (value == null || typeof value !== 'object') return undefined
    value = (value as Record<string, unknown>)[key]
  }
  return value
}

for (const keys of paths) {
  const value = get(input, keys)
  if (value != null && value !== '') {
    process.stdout.write(typeof value === 'string' ? value : String(value))
    break
  }
}
