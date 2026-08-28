---
description: Claude Code multi-agent harness — slash commands, hooks, and design principles
globs:
  - '.claude/**'
---

# Claude Code Harness

Multi-agent harness inspired by the generator/evaluator pattern. Slash commands implement specialized agent roles, and a spec → plan → implement → review flow supports spec-driven development.

## Workflow Commands (use in order for a feature)

- **Phase 0 — `superpowers:brainstorming`** _(optional; a plugin skill, not a project command)_: shape a fuzzy idea into an agreed design before `/spec` captures it. Skip it when the requirement is already clear. It is the pipeline's first phase in `docs/ai-driven-development.md`; details in the plugin list below.
- `/spec <description>` — Spec agent: captures the _what & why_ (problem, requirements, acceptance criteria, non-goals) of a feature and writes it to `docs/specs/<YYYY-MM-DD-slug>.md`. The upstream artifact. Runs on **Opus**.
- `/plan <task | path/to/spec.md>` — Planner agent: expands a task or a spec into a detailed implementation plan with ordered steps and acceptance criteria. Writes to `.claude/plans/<YYYY-MM-DD-slug>.md` and records it in the `.claude/plans/.current` pointer file. Use `/plan list` to view all plans and `/plan switch <prefix>` to repoint `.current`. Runs on **Opus**.
- `/implement [context]` — Generator agent: implements the current plan step by step, self-checking `bun run check-types` + `bun run check-format` after each step, plus the conditional gates keyed on what the step touched — the Terraform gates from `.claude/rules/infra.md` for `infra/**`, `react-doctor --scope changed` for React, `/db-check` when the Prisma schema changed, `/design-review` for UI-visible changes. It then runs the step's **Verify:** command (falling back to `playwright` for UI behaviour) before checking off any acceptance criterion. Runs on **Sonnet**.
- `/qa [scope]` — QA orchestrator: runs the deterministic gates, then spawns the reviewers in parallel (security, correctness, acceptance-criteria — plus infra when the diff touches `infra/**`, plus cicd when it touches `.github/**`) and synthesizes a scored verdict against the plan's acceptance criteria. Runs on **Sonnet**, as do all of its spawned reviewer subagents.

## Unattended loop (optional)

- `/run-backlog [issue-number]` — manual trigger for the `backlog-runner` loop (`.claude/skills/backlog-runner/`, built with `loop-maker`): discovers `ready-for-agent` GitHub issues and orchestrates the same `/spec → /plan → /implement → /qa` commands above, advancing each issue one phase at a time and pausing at human gates (after spec, after plan, before merge). Gate and budget specifics live in `.claude/skills/backlog-runner/HUMAN-GATES.md`, not here.

## Quality Commands

- `/review [files]` — Code-review orchestrator: spawns the security and correctness reviewers (no plan needed). Works on the current branch vs `origin/main`.
- `/pre-commit` — Quick quality gate: oxc (lint + format) + types + a security eyeball before committing.
- `/design-review` — Design-quality review of UI changes: impeccable critique + audit driven through Playwright, reported as Blockers/High/Medium/Nitpicks. Complements `/qa` (which covers code correctness) for any UI-touching branch.
- `/db-check` — Database migration safety: reviews Prisma schema changes for data loss, performance, compatibility, and authz/soft-delete risks.
- `/doctor` — React health triage via the `react-doctor` skill (`.claude/skills/react-doctor/`): scans React code for security, performance, correctness, a11y, and architecture issues (0–100 score) and runs the canonical scan → triage → fix → validate loop. The quick form — `bunx react-doctor@latest --verbose --scope changed` — is also a per-step gate in `/implement` and a Phase 1 gate in `/qa` + `/review` + `/pre-commit` for React-touching diffs. CI mirrors it in `react-doctor.yml` (new errors fail the PR).

The **Phase 1 deterministic gates** shared by `/qa`, `/review`, and `/pre-commit`: oxlint + oxfmt, `bun run check-types`, `react-doctor --scope changed`, and — when the diff touches `.github/**` — `actionlint` (a failure is a gate FAIL) plus `zizmor` (findings are advisory input for the `cicd-reviewer`, never a gate on their own).

## Reviewer subagents (`.claude/agents/`)

- `security-reviewer` — Cognito `auth: true` enforcement, CASL authorization, Zod-at-the-boundary, the BFF rule, secrets, S3 scoping. Emits **Security**.
- `correctness-reviewer` — neverthrow `Result` flow, `AppError` usage, layer boundaries, Prisma queries/transactions, type safety, code quality. Emits **Correctness**, **Architecture**, **Code quality**.
- `acceptance-criteria-reviewer` — walks the plan's acceptance criteria against the diff. Emits **Acceptance criteria**. (`/qa` only — it needs a plan.)
- `infra-reviewer` — Terraform/HCL diffs: IAM least privilege, public exposure, state safety, destructive-change risk, module conventions. Emits **Infrastructure**. (Spawned by `/qa` and `/review` only when the diff touches `infra/**`.)
- `cicd-reviewer` — GitHub Actions / CI-CD diffs: least-privilege `GITHUB_TOKEN`, action SHA-pinning, expression injection, fork-safety, OIDC usage, concurrency/timeout hygiene, deploy-pipeline invariants, DORA-metric impact. Emits **CI/CD**. (Spawned by `/qa` and `/review` only when the diff touches `.github/**`.) It doubles as a standalone **DevOps engineer** agent — dispatch it directly to audit, improve, or author workflows and DORA instrumentation.

So `/qa` produces five scores from three reviewers (plus Infrastructure and/or CI/CD when the diff touches `infra/**` or `.github/**`); `/review` produces four (it drops acceptance-criteria; same conditional additions).

## Hooks (automatic)

- Edited/written files are auto-formatted with **oxfmt/oxlint** (`auto-format.sh`, PostToolUse).
- `.env` files and other secret-bearing files are protected from reads/edits (`protect-env.sh`); secret literals are blocked from being written.
- Destructive and secret-exfiltrating shell commands are blocked (`protect-destructive.sh`, `protect-bash.sh`).
- On session start, branch + active plan + recent commits are surfaced (`session-start.sh`).
- On stop, a TypeScript check gates the turn from ending with type errors (`stop-typecheck.sh`).
- When `graphify-out/graph.json` exists, two **inline** `PreToolUse` hooks (defined in `settings.json` itself, not as scripts) inject a `MANDATORY: run graphify first` reminder before any `grep`/`find`-style Bash call and before any source-file `Read`/`Glob`. This makes `graphify` the first step of every exploration, not an optional one — pass the same rule into subagent prompts, since the hooks fire for them too.

## Design Principles

- Generator and evaluator are separate agents — self-evaluation is unreliable.
- Plans and specs use acceptance criteria — "works correctly" is not testable; "returns 403 when a non-author calls PUT /posts/:id" is.
- File-based inter-agent communication — specs live in `docs/specs/`, plans in `.claude/plans/` (active one named in `.current`), read by the other commands.
- Evaluators are calibrated for skepticism — leniency bias is counteracted with explicit grading anchors.
- Engineering principles live in `.claude/rules/principles.md` (clean code + _A Philosophy of Software Design_); tech-stack docs win on conflict.

## Project commands vs plugin skills

The `.claude/commands/` files are **project-specific orchestrators** — they encode this codebase's conventions (Elysia plugin/controller/service triad, neverthrow `ResultAsync`, Zod at the boundary in `@shared/config`, CASL, the BFF boundary) and delegate to subagents in `.claude/agents/`. Use them when working on this repo.

The enabled plugins (`.claude/settings.json`) are **generic workflows** independent of this codebase. They handle the meta-work _around_ implementation and slot into the same pipeline. Rule of thumb: plugins decide _what to build and in what order_; project commands build it _correctly in this codebase_.

Where each plugin fits the spec → plan → implement → review → ship flow:

- **`superpowers:brainstorming`** — shape a fuzzy idea into an agreed design _before_ `/spec` captures it. One question at a time, 2–3 approaches with trade-offs.
- **`superpowers:writing-plans`** / **`superpowers:executing-plans`** — the generic small-verifiable-steps discipline the project `planner` builds on (behind `/plan`), and its counterpart's review-checkpoint discipline (behind `/implement`). The project commands own the actual flow; reach for these directly only when working a plan outside `/plan` + `/implement`.
- **`feature-dev`** (command + `code-explorer` / `code-architect` agents) — trace how an existing feature works and produce an architecture blueprint before planning a change. Feeds a sharper `/spec`/`/plan`.
- **`impeccable`** — design fluency during `/implement` and review: `/impeccable init` writes per-app `PRODUCT.md`/`DESIGN.md`, `craft`/`shape` build UI, `critique`/`audit`/`polish` review it (45 deterministic anti-pattern rules). The project `app-design` skill (`.claude/skills/app-design/`) wires impeccable + the `shadcn` skill + this repo's component conventions together and sets precedence between them; `/design-review` is the project wrapper that drives `critique` + `audit` through a real browser for a UI-touching branch.
- **`superpowers:using-git-worktrees`** — isolate feature work in a worktree during `/implement`. Also invoked by the `backlog-runner` loop's step 0 to give each queued issue its own isolated worktree instead of switching branches in one shared directory.
- **`superpowers:systematic-debugging`** — root-cause loop when `/implement` hits a bug, instead of guess-and-patch.
- **`playwright`** (plugin) — drive a real browser to verify UI / E2E flows. There is **no unit-test runner** in this repo, so browser-level checks are the primary frontend verification. It is registered as a **plugin only** — don't re-add it to `.mcp.json`, which loads a second, duplicate browser toolset. Use its bundled Chromium; never attempt `npx/bunx playwright install chrome` or a `chrome`/`msedge` channel, which need a system browser install that isn't available in sandboxed agent environments. If Chromium itself is missing, install it with `npx playwright install chromium`, not a system channel.
- **`graphify`** (MCP, `.mcp.json`) — the codebase knowledge graph, and the _first_ step of any exploration during `/implement`: the two `PreToolUse` hooks above fire a mandatory reminder if you grep or read source before querying it. `graphify query "<question>"` returns a scoped subgraph; `path` / `explain` for relationships and concepts; `graphify update .` after modifying code. Full usage rules in `CLAUDE.md` ("Codebase graph").
- **`next-devtools`** (MCP, `.mcp.json`) — Next.js-specific introspection for `apps/nextjs-boilerplate`: `nextjs_docs` for version-current App Router / Cache Components docs, `nextjs_index` to map the route tree, `browser_eval` for a quick in-page check. Prefer it over `context7` for questions about Next.js itself (narrower and version-aware); `context7` stays the tool for every other library.
- **`superpowers:verification-before-completion`** — no "it's done" claims without running the command and showing output. Gates the same turn the Stop type-check hook does.
- **`code-simplifier`** (agent, `code-simplifier:code-simplifier`) — dispatch it to simplify a working diff for clarity (no behavior change) after `/implement`, before `/qa`. Prefer the agent over the built-in `simplify` skill: it runs in its own context, so a cleanup pass doesn't consume the implement session's window. Both are quality-only — finding bugs is `/qa`'s job, not theirs.
- **`react-doctor`** (project skill, `.claude/skills/react-doctor/`) — deterministic React scanner complementing the reviewer subagents: they judge against this repo's conventions; it catches framework-level React mistakes (hooks misuse, derived state, a11y, bundle size) with exact rules. Regression-check after React changes; `/doctor` for a full triage pass.
- **`feature-dev:code-reviewer`**, **`superpowers:requesting-code-review`** / **`receiving-code-review`** — general review passes that complement the project's `/qa` + `/review` reviewers.
- **`superpowers:finishing-a-development-branch`** — structured merge / PR / cleanup once QA is green.
- **`context7`** (MCP) — fetch _current_ docs for any library (Elysia, Next.js, Prisma, CASL, Zod, Tailwind) instead of relying on the training cutoff. Use anytime; especially before applying an unfamiliar API.
- **`claude-md-management`** (`/revise-claude-md`, `claude-md-improver`) and **`skill-creator`** / **`superpowers:writing-skills`** — harness maintenance: keep `CLAUDE.md` and the rule files accurate as conventions evolve, and author or revise the project skills in `.claude/skills/`. Re-audit this list against `settings.json` + `.mcp.json` whenever either changes — an enabled plugin that isn't placed in this list is a plugin nobody reaches for.
- **`terraform-skill`** (antonbabenko) — generic Terraform/OpenTofu best practice: module design, native `terraform test`, state ops, CI/CD and scan patterns. Triggers automatically on Terraform/HCL work. Repo-specific conventions and the local gates live in `.claude/rules/infra.md`, which wins on conflict; the `infra-reviewer` subagent covers review.
- **`terraform`** (MCP, `.mcp.json`) — HashiCorp's terraform-mcp-server (Docker): authoritative Terraform Registry lookups — provider resource/data-source schemas, module inputs, versions. Use it before writing HCL against an unfamiliar resource, the way `context7` is used for app libraries.
- **`deploy-on-aws`** (MCP: `awsknowledge` / `awsiac` / `awspricing`) — AWS documentation search, IaC validation helpers, and pricing lookups. Use it for AWS service questions any time, and for cost estimates at `/spec` / `/plan` time on cost-shaped work — not only during `/implement`. Its `aws-architecture-diagram` skill is in scope for regenerating the `docs/architecture.md` diagrams; the `deploy` / `elastic-beanstalk` skills are not (this repo's deployment is already defined in `infra/`).

For the full developer-facing walkthrough of this flow, see `docs/ai-driven-development.md`.
