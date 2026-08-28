# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Doc map:** human setup/onboarding lives in the `README.md` files (per package); Claude's rules and patterns live here and in `.claude/rules/`. The source of truth for runnable scripts is each `package.json`.

@.claude/rules/architecture.md
@.claude/rules/conventions.md
@.claude/rules/principles.md

## Commands

Full script list is in `apps/nextjs/package.json` — this repo has one workspace. Non-obvious ones:

```bash
turbo dev --filter=nextjs    # run the app
bun run check-types                      # tsc --noEmit
bun run check-format                     # oxlint + oxfmt --check (lint + format, no writes)
```

**Database** (Prisma + Neon, `apps/nextjs/src/lib/prisma.ts`, requires `DATABASE_URL`):

```bash
turbo db:generate --filter=nextjs   # prisma generate — runs as the app's prebuild
cd apps/nextjs && bun run db:migrate # prisma migrate dev (interactive)
```

There is **no test runner configured** in this repo yet. CI runs SonarQube, dependency security audits (`bun audit` + SBOM/Grype), secret scanning (gitleaks), and React Doctor — not unit tests. Type-checking and the linter/formatter run locally (Lefthook pre-commit hook, `/pre-commit`, and the per-step gates in `/implement`), not in CI.

### Tooling notes

- **oxlint + oxfmt** (the oxc toolchain, not ESLint/Prettier/Biome) is the linter+formatter. Config in `.oxlintrc.json`/`.oxfmtrc.json`: single quotes, no semicolons, 2-space indent, 80 cols, no trailing commas. `typescript/no-explicit-any` is an **error**. Imports are auto-organized (`oxfmt`'s `sortImports`); Tailwind classes are auto-sorted (`sortTailwindcss`).
- Git hooks are managed by **Lefthook** (`lefthook.yml`, installed via the `prepare` script). Pre-commit runs `oxfmt`/`oxlint --fix` on staged TS/JS/YAML/MD/JSON, `terraform fmt -recursive` when `infra/**` HCL is staged, and `gitleaks` on every staged change; `commit-msg` runs commitlint; `pre-push` runs `turbo run check-types build --affected`; `post-commit` rebuilds the graphify graph.
- Package versions are kept in sync across workspaces with `syncpack` (`bun run check-mismatches` / `bun run sync-packages`).
- **[fallow](https://docs.fallow.tools/)** is a _local_ static-analysis CLI configured by `.fallowrc.json` (repo root). It flags unused/dead code, semantic code duplication (≥3 occurrences, `**/lib/**` ignored), high complexity, and architecture drift across the `apps/*` workspace. Run `fallow` from the repo root.
- **SonarQube** is the _CI_ code-quality backstop. It scans every push to `main` and every PR (dependabot excluded) for bugs, vulnerabilities, and code smells — you don't run it locally.
- **[react-doctor](https://github.com/millionco/react-doctor)** is the React-specific scanner (security, performance, correctness, a11y, architecture; 0–100 health score). It runs both _locally_ — `bunx react-doctor@latest --verbose --scope changed` after React changes, full triage via the `react-doctor` skill (`/doctor`) — and in _CI_ (`react-doctor.yml`): PRs are gated on new **errors** (warnings advisory), pushes to `main` get a non-blocking health snapshot. Rule config lives in `doctor.config.*` if one exists.
- **[gitleaks](https://github.com/gitleaks/gitleaks)** scans for hardcoded secrets (API keys, tokens, credentials). Runs both _locally_ — a Lefthook pre-commit job scanning staged changes (`gitleaks protect --staged`; skips gracefully if `gitleaks` isn't installed) — and in _CI_ (`security.yml`'s `gitleaks` job, via `gitleaks-action`, unconditional on every PR): a detected secret fails the PR and gets commented inline. Config in `.gitleaks.toml` (extends gitleaks' default ruleset; allowlist path patterns for known non-secrets, e.g. `.env.example` files). No license key needed — this repo is a public personal-account repo, not a GitHub organization.

## Rules

The hard rules live in the rule files loaded alongside this one — `architecture.md` (where things live: feature folders, server-only data access, shared packages), `conventions.md` (how code is written: Result flow, validation at the boundary, exports), `principles.md` (why), `infra.md` (Terraform: environments-as-config, local gates). Each rule is stated exactly once, in its owning file — don't restate them here or in commands.

## Codebase graph

This project has a knowledge graph at graphify-out/ (gitignored, generated locally via `bun run graphify:build`) with god nodes, community structure, and cross-file relationships. Use it to navigate the repo without re-reading files. Query the graph via the `graphify` MCP tools in any session.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Context management

When compacting, always preserve:

- The list of files modified this session
- Any unresolved type errors or lint/format violations
- The active task or goal
