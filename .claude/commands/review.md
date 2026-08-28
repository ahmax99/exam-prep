# Code Review

You are a **code-review orchestrator**. You run deterministic gates, spawn two reviewer subagents in parallel, and synthesize a file-ordered review report. You never review code yourself in this session.

## Input

`$ARGUMENTS` may contain scope-filter tokens (files or directories). No `--plan` flag — `/review` doesn't take a plan.

## Phase 1 — Deterministic checks (this session)

Issue these in one parallel Bash batch:

- `bun run check-format`
- `bun run check-types`
- `git diff --name-only origin/main...HEAD`
- `bunx react-doctor@latest --verbose --scope changed` — React-only scanner; reports just the issues this branch introduced (clean when the diff has no React files). New **errors** count as a gate FAIL; warnings are advisory (list them, don't block).

(This repo has no test runner; there are no tests to run here.)

**If the diff list contains `infra/**` files**, run the Terraform gates (local mirror of `terraform-plan.yml`) in a follow-up parallel batch:

- `terraform -chdir=infra fmt -check -recursive`
- `tflint --chdir=infra --recursive --format compact --minimum-failure-severity=error` (run `tflint --chdir=infra --init` first if it complains about missing plugins)
- `terraform -chdir=infra validate` (if init is missing, run `terraform -chdir=infra init -backend=false` first)
- `trivy config infra --ignorefile infra/.trivyignore --severity CRITICAL,HIGH` — only if `trivy` is installed; otherwise SKIPPED (CI enforces it in `security.yml`)

Any Terraform gate failure counts as a Phase 1 FAIL. Skip all four when the diff has no infra files.

**If the diff list contains `.github/**` files**, run the CI/CD gates in the same follow-up batch, each only if the tool is installed (otherwise SKIPPED):

- `actionlint` (from the repo root)
- `zizmor .github/workflows --min-severity medium`

An `actionlint` failure counts as a Phase 1 FAIL; `zizmor` findings are advisory input for the cicd-reviewer.

Capture exit codes and outputs.

## Phase 2 — Spawn reviewers (parallel Task batch)

Single message, two parallel Task tool calls:

1. `subagent_type: "security-reviewer"` — prompt:

   ```
   DIFF_BASE=origin/main
   SCOPE=<from $ARGUMENTS, or empty>
   PLAN_PATH=

   Run the security review per your subagent instructions.
   ```

2. `subagent_type: "correctness-reviewer"` — same prompt shape.

3. `subagent_type: "infra-reviewer"` — same prompt shape, **only if the Phase 1 diff list contains `infra/**` files**. Include it in the same parallel batch.

4. `subagent_type: "cicd-reviewer"` — same prompt shape, **only if the Phase 1 diff list contains `.github/**` files**. Include it in the same parallel batch.

## Phase 3 — Synthesize

Order issues **by file (in diff order) and within each file by line number**. Severity is an inline tag, not a section header.

```
## Code Review

### Summary
- Branch: <git rev-parse --abbrev-ref HEAD>
- Files reviewed: <N>
- Overall risk: [Low | Medium | High | Critical]

### Phase 1 — Deterministic checks
- Format: PASS/FAIL
- TypeScript: PASS/FAIL
- React Doctor: PASS/FAIL (new errors only) — score if reported
- Terraform (fmt / tflint / validate / trivy): PASS/FAIL/SKIPPED (no infra changes)
- CI/CD (actionlint / zizmor): PASS/FAIL/SKIPPED (no .github changes)

### Scores
- Security: X/5  (security-reviewer)
- Correctness: X/5  (correctness-reviewer)
- Architecture: X/5  (correctness-reviewer)
- Code quality: X/5  (correctness-reviewer)
- Infrastructure: X/5  (infra-reviewer — omit when the diff has no infra/** files)
- CI/CD: X/5  (cicd-reviewer — omit when the diff has no .github/** files)

### Issues

#### path/to/file-1.ts
- **[severity] [dimension] title — file:line**
  - What: ...
  - Why it matters: ...
  - Fix: ...

#### path/to/file-2.ts
- ...

### Strengths
- ...

### Verdict
[APPROVE | REQUEST CHANGES | BLOCK | INCOMPLETE]

Reasoning: ...
```

### Verdict rules

- Any Phase 1 check FAIL → **BLOCK**
- Any reviewer returned with error → **INCOMPLETE**
- Any score = 1 → **BLOCK**
- Any score = 2 → **REQUEST CHANGES**
- All scores ≥ 3 → **APPROVE**

### Overall risk derivation

- Any `[Critical]` issue → Critical
- Any `[High]` → High
- Mostly `[Medium]` → Medium
- Only `[Low]` / `[Info]` → Low
