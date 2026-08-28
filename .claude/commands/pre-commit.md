# Pre-commit Check

Run a quick quality gate on staged/changed files before committing.

> Note: a Lefthook pre-commit hook already runs `oxfmt`/`oxlint --fix` on staged files (and `terraform fmt` on staged HCL). This command is the broader, pre-push-quality gate (types + a security eyeball) that the git hook doesn't cover.

## Process

Run these checks in parallel (one message, parallel Bash calls):

1. **Format + lint**: `bun run check-format` (oxlint + oxfmt — lint + format check, no writes). If it reports fixable issues, `bun run format` writes them.
2. **Type check**: `bun run check-types` (Turbo runs `tsc --noEmit` across packages).

Then review changed files (`git diff --cached --name-only` for staged, or `git diff --name-only` for unstaged):

3. **React health regression** — if the change touches React code (`.tsx`/`.jsx`, or anything under `apps/nextjs-boilerplate/src/`), run `bunx react-doctor@latest --verbose --scope changed`. `--scope changed` reports only issues the branch introduced vs the base, so a clean run means no regression. New **errors** are a FAIL; warnings are advisory — mention them but don't block. Skip this check entirely for backend/infra-only changes. (CI runs the same gate via `react-doctor.yml`, so catching it here avoids a red PR.)

4. **Terraform gates** — if the change touches `infra/**`, run `terraform -chdir=infra fmt -check -recursive` and `tflint --chdir=infra --recursive --format compact --minimum-failure-severity=error` (plus `terraform -chdir=infra validate` for anything beyond formatting). These mirror `terraform-plan.yml`, so a failure here is a failure the PR would hit. Skip entirely for non-infra changes. Also eyeball: no secret values in `.tf`/`.tfvars`, no new `.trivyignore` entry without a justification comment.

5. **Quick security scan** on changed files:
   - No hardcoded secrets, API keys, or tokens
   - No `.env` files staged (`.env.example` is fine)
   - No stray `console.log` in production code (the backend logger / intentional logging utilities are fine)
   - No `any` types without a justification comment (`typescript/no-explicit-any` is an oxlint error and will fail the format gate anyway)
   - No `// TODO` / `// FIXME` without a reference
   - No obvious dead code or copy-pasted blocks introduced by the change (the deeper version of this is **fallow** + SonarQube — see below)

**Optional — dead code / duplication (`fallow`):** if the `fallow` CLI is installed, run `fallow` from the repo root to catch unused exports, semantic duplication, and complexity spikes the change may have introduced. It analyzes the whole workspace, so it's heavier than the gates above — skip it for tiny changes; run it before committing a refactor or a new module.

## Output

Report results concisely:

```
## Pre-commit Check
- Format + lint: PASS/FAIL
- Types: PASS/FAIL
- React Doctor: PASS/FAIL/SKIPPED (no React changes)
- Terraform (fmt / tflint / validate): PASS/FAIL/SKIPPED (no infra changes)
- Security scan: PASS/FAIL

[Issues found, if any]

Verdict: READY TO COMMIT / FIX ISSUES FIRST
```

If all checks pass, suggest a **[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#summary)** message based on the changes (`type(scope): subject` — e.g. `feat(posts): add reactions endpoint`, `fix(auth): handle missing X-Id-Token`; types: `feat|fix|chore|refactor|docs|test|ci|build|perf`) and proceed with the commit. If any check fails, show the errors and offer to fix them.
