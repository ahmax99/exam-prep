# AI-Driven & Spec-Driven Development

This boilerplate ships with a [Claude Code](https://claude.com/claude-code) harness so you can build features _with_ an AI agent instead of just chatting at it.

You don't need to read the harness internals to use it. Just learn the pipeline below and the order to run it in.

## The idea in one minute

**Spec-driven development** means you write down _what_ you want and _how you'll
know it's done_ (acceptance criteria) **before** any code is written. **AI-driven development** means an agent does the typing, while you review the idea, the spec, the plan, and the diff at each gate.

These combine into a simple pipeline. Each step writes a file (or a shared
understanding) that the next step reads, so the agent never loses the thread:

```
  brainstorm  ──►  /spec  ──►  /plan  ──►  /implement  ──►  /qa  ──►  ship
  shape the        what &      ordered     write the        scored    merge
  idea             why         steps       code             review    / PR
  (optional)
```

- **Brainstorm** _(optional, for fuzzy ideas)_ — talk the idea through with the agent before committing to a spec: purpose, constraints, trade-offs, 2–3
  approaches. This is the `superpowers:brainstorming` skill; its output feeds `/spec`. Skip it when the requirement is already clear.
- **`/spec`** captures the problem, goals, non-goals, and **testable acceptance criteria**. Output: `docs/specs/<date>-<slug>.md`.
- **`/plan`** turns a spec (or a one-line task) into ordered implementation steps.
  Output: `.claude/plans/<date>-<slug>.md`, tracked as the active plan in
  `.claude/plans/.current`.
- **`/implement`** works the plan step by step, self-checking types and formatting as it goes.
- **`/qa`** runs the gates and three reviewers (security, correctness,
  acceptance-criteria) and scores the work against the plan.
- **Ship** — once QA is green, the `superpowers:finishing-a-development-branch` skill walks you through the merge / PR / cleanup decision.

Why bother instead of one big prompt? Because "make it work" isn't checkable, but _"returns 403 when a non-author calls `PUT /posts/:id`"_ is. Acceptance criteria are what let the agent — and you — know the feature is actually done.

## Quick start

Open Claude Code in the repo root and build your first feature:

```text
1.  /spec add a "favorite a post" feature for logged-in users
        → review docs/specs/2026-06-13-favorite-a-post.md, edit anything off.

2.  /plan docs/specs/2026-06-13-favorite-a-post.md
        → review the ordered steps and acceptance criteria.

3.  /implement
        → the agent writes code, running `bun run check-types` and
          `bun run check-format` after each step.

4.  /qa
        → read the scored verdict. Address any FAIL/UNVERIFIABLE criteria,
          then re-run if needed.
```

You stay in the loop at every arrow: approve the spec before planning, approve the plan before implementing, and read the QA verdict before committing.

> **Lighter-weight tasks.** For a small change you don't need the full pipeline.
> Jump straight to `/plan "<task>"` and `/implement`, or just describe the change.
> The spec step earns its keep on features with real requirements and edge cases.

## Unattended: the backlog-runner loop (optional)

Everything above is you driving the pipeline by hand, one command at a time. `backlog-runner` is an optional unattended driver over that _same_ pipeline: it discovers `ready-for-agent` GitHub issues and runs `/spec → /plan → /implement → /qa` for you, advancing up to 3 issues per invocation — but it pauses for your approval after the spec and after the plan, and it never merges its own PR. You trigger it manually:

```text
/run-backlog
```

It's built as a Claude Code skill (`.claude/skills/backlog-runner/`) using the `loop-maker` skill's discovery → verification → human-gate pattern, so the same "you approve the risky parts" guarantee from the manual pipeline still holds — just at issue granularity instead of command granularity. The design rationale (why GitHub labels for state, why a separate deterministic verifier script judges `/qa`'s report instead of the model grading itself, why there's no wall-clock budget) lives in the design spec: `docs/superpowers/specs/2026-07-09-backlog-runner-agent-loop-design.md`. Gate and budget specifics live in `.claude/skills/backlog-runner/HUMAN-GATES.md`, not here.

## Quality commands (use any time)

These don't need a spec or plan — run them on whatever you've changed:

- **`/review [files]`** — spawns the security + correctness reviewers against the current branch vs. `origin/main`. Four scores, no plan required.
- **`/pre-commit`** — fast gate before committing: oxc (lint + format) + types + a security eyeball. Also nudges toward a [Conventional Commits](https://www.conventionalcommits.org) message.
- **`/db-check`** — reviews Prisma schema/migration changes for data loss,
  performance, compatibility, and authz/soft-delete risks. Run it whenever you touch `shared/neon/prisma/`.
- **`/doctor`** — full React health triage via [react-doctor](https://github.com/millionco/react-doctor): scans for security, performance, correctness, and accessibility issues with a 0–100 score, then walks a scan → triage → fix → validate loop. The quick regression check (`bunx react-doctor@latest --scope changed`) already runs inside `/implement`, `/pre-commit`, `/review`, and `/qa` for React-touching changes — and in CI on every PR, where new errors fail the build.

## Plugin skills that supercharge each phase

The project commands above are _codebase-specific_ orchestrators. This template also enables general-purpose Claude Code plugins that handle the _meta-work around_ implementation and slot into the same pipeline: brainstorming a fuzzy idea (`superpowers:brainstorming`), exploring existing code before planning (`feature-dev`), building distinctive UI (`impeccable` + the project `app-design` skill), browser-level verification (`playwright` — this repo has no unit-test runner), current library docs (`context7`), Terraform best practice (`terraform-skill` + the `terraform` MCP server), and structured shipping (`superpowers:finishing-a-development-branch`). You rarely invoke them by name; the agent reaches for them when the situation fits.

The full phase-by-phase mapping — which plugin fits where, and what wins on conflict — lives in **`.claude/rules/harness.md`** ("Where each plugin fits"). That file is the single source of truth the agent loads every session; this doc deliberately doesn't duplicate the table, so update it there.

> **Project commands vs. plugins, in one line:** plugins decide _what to build and
> in what order_; the `/spec`→`/plan`→`/implement`→`/qa` commands build it
> _correctly in this codebase_. Infra work rides the same pipeline: specs and plans
> can include Terraform steps, `/implement` gates them with `terraform fmt`/`tflint`/
> `terraform validate` (mirroring `terraform-plan.yml`), and `/qa`/`/review` add an
> `infra-reviewer` pass when the diff touches `infra/**`.

## What keeps the agent on the rails

The agent isn't guessing how this codebase works — it reads a set of rule files on every task. You generally won't edit these, but it helps to know they exist:

| File                            | What it encodes                                                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `CLAUDE.md`                     | Entry point: commands, the hard rules, and imports of the rules below.                                                 |
| `.claude/rules/architecture.md` | _Where things live_ — the Elysia plugin/controller/service triad, the Next.js BFF boundary, the shared packages.       |
| `.claude/rules/conventions.md`  | _How to write code here_ — validation at the boundary, the neverthrow `Result` flow, auth/CASL, exports.               |
| `.claude/rules/principles.md`   | _Why_ — clean-code + _A Philosophy of Software Design_. (Tech-stack docs win on conflict.)                             |
| `.claude/rules/code-review.md`  | The checklist the reviewers grade against.                                                                             |
| `.claude/rules/infra.md`        | Terraform conventions — layout, environments-as-config, state safety, and the local gates that mirror the CI pipeline. |

Two safety nets run automatically while you work: edited files are auto-formatted with oxfmt/oxlint, secret-bearing files and destructive shell commands are blocked, and a type-check gates the end of each turn. You don't invoke these — they just run.

## Where artifacts live

```
docs/specs/                  ← specs from /spec  (committed; the "what & why")
.claude/plans/               ← plans from /plan  (git-ignored; working notes)
.claude/plans/.current       ← pointer to the active plan
```

Specs are committed because they document intent for the whole team. Plans are git-ignored working notes — use `/plan list` to see them and `/plan switch <prefix>` to change which one is active.

## Tips

- **Edit the spec and plan freely.** They're just Markdown. Fix a wrong assumption before `/implement` rather than after.
- **Make acceptance criteria concrete.** "Validates input" is weak; "returns 422 with a Zod error when `title` is empty" is gradable.
- **Let `/qa` be skeptical.** The reviewers are tuned to push back. A FAIL is cheaper to fix now than in review.
- **One feature per pipeline.** Keep specs and plans focused — small, shippable slices review better and the agent stays accurate.

For the harness internals (subagents, hooks, the generator/evaluator design), see `.claude/rules/harness.md`.
