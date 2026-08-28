---
model: opus
---

# Plan

`/plan` dispatches on the first token of `$ARGUMENTS`:

- `list` → list all plans (no subagent)
- `switch <slug-prefix>` → repoint the `.current` pointer file (no subagent)
- anything else → treat the full `$ARGUMENTS` as a task description (or a path to a `docs/specs/` spec) and spawn the `planner` subagent

Plan-tracking uses a plain-text pointer file, `.claude/plans/.current`, holding the active plan's filename (e.g. `2026-06-13-post-reactions.md`). No symlinks — a plain file diffs, greps, and merges cleanly, which a symlink does not.

## Default: spawn planner

If `$ARGUMENTS` is empty, abort with:

> Usage: `/plan <task description | path/to/spec.md>` | `/plan list` | `/plan switch <slug-prefix>`

Otherwise, invoke a single Task tool call with:

- `subagent_type: "planner"`
- prompt:

  ```
  TASK: $ARGUMENTS
  PROJECT_DIR: <pwd output>

  Produce a plan per your subagent instructions.
  ```

When the planner returns, print its summary verbatim and tell the user that `/implement` will use this plan by default. If `$ARGUMENTS` points at a `docs/specs/` file, mention that the plan was derived from that spec.

## `/plan list`

Run:

```bash
ls -1 .claude/plans/*.md 2>/dev/null | sort -r
```

For each plan file, read it once and:

- Extract the first `# Plan: <Title>` line for the title
- Count `- [x]` vs total `- [x]` + `- [ ]` lines for acceptance-criteria progress

Resolve the active plan:

```bash
cat .claude/plans/.current 2>/dev/null
```

Print one line per plan, sorted newest-first. The `→` marker indicates the plan named in `.current`:

```
→ 2026-06-13-post-reactions          [5/14]   Post Reactions
  2026-06-10-comment-pagination       [12/12]  Comment Pagination (complete)
  2026-06-04-presigned-url-hardening  [3/8]    Presigned URL Hardening
```

If no plans exist, print `No plans in .claude/plans/.`.

## `/plan switch <slug-prefix>`

**Validation (REQUIRED before any shell interpolation):** Before substituting `prefix` into the glob below, verify it matches `^[A-Za-z0-9_.-]+$`. If it doesn't, abort with "Invalid prefix — only letters, digits, `_`, `.`, and `-` are allowed." Do not attempt to escape or sanitize — reject and ask the user to retype.

Resolve `prefix`:

```bash
# Enable nullglob so an empty match expands to nothing instead of the literal pattern.
shopt -s nullglob
matches=( .claude/plans/${prefix}*.md )
shopt -u nullglob
```

- Zero matches (`${#matches[@]} -eq 0`): abort with "No plan matching prefix '<prefix>'."
- Multiple matches: list them and abort with "Ambiguous prefix; specify more characters."
- Exactly one match:
  ```bash
  basename "${matches[0]}" > .claude/plans/.current
  ```
  Print: `.current → <matched-basename>.md`.

## Notes

- This command only writes to `.claude/plans/`. It never edits source code.
- The planner subagent handles slug generation, file writing, and updating `.current` — `/plan` itself doesn't touch those paths in the default case.
- `.claude/plans/.current` is the single source of truth for "which plan is active"; `/implement`, `/qa`, and the session-start hook all read it.

## Sharpening the input

A plan is only as good as the task fed to it. For non-trivial work, lean on plugins first (see `.claude/rules/harness.md`):

- For a fuzzy idea, run `superpowers:brainstorming` → `/spec` so the planner gets a concrete spec, not a vague sentence.
- Before planning a change to **existing** code, use `feature-dev`'s `code-explorer` (trace how it works today) and `code-architect` (blueprint the change). Pass their findings in as part of the task description.
