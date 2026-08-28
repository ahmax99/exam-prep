---
model: opus
---

# Spec

`/spec <feature description>` turns a rough feature idea into a structured **specification** — the _what_ and _why_, before any _how_. The spec is the upstream artifact in this repo's spec-driven flow:

```
/spec <idea>   →  docs/specs/<YYYY-MM-DD-slug>.md   (what & why, acceptance criteria)
/plan <spec>   →  .claude/plans/<slug>.md           (how — ordered steps)
/implement     →  code                              (build it, step by step)
/qa            →  scored verdict against the spec's criteria
```

This command writes a spec; it never edits source code.

## Input

If `$ARGUMENTS` is empty, abort with:

> Usage: `/spec <feature description>`

## Process

### 1. Clarify first (don't guess)

A spec is only useful if it pins down ambiguity. Before writing, ask the user the smallest set of questions that resolve genuine forks — scope boundaries, who the actor is, what "done" means, edge cases, non-goals. Ask only what you can't answer from the codebase or sensible defaults. If the idea is already crisp, skip straight to writing.

### 2. Generate the slug

- Date: today via `date +%Y-%m-%d`
- Title: kebab-case from the feature, max 6 words, lowercase, ASCII only
- **Validate** the slug against `^[a-z0-9-]+$` before using it in any shell command. If it doesn't match, ask the user to rephrase — do not escape/quote your way around it.
- File: `docs/specs/<date>-<slug>.md` (create `docs/specs/` if it doesn't exist). If the file exists, append `-2`, `-3`, … until unique.

### 3. Write the spec

Use this template:

```markdown
# Spec: <Title>

> Status: Draft · <date>

## Problem / Context

<What's the user-facing need or pain? Why now? 2–4 sentences.>

## Goals

- <Outcome 1 — what success looks like, not how>

## Non-Goals

- <Explicitly out of scope, to prevent scope creep>

## Requirements

### Functional

- <Observable behaviour the system must have>

### Constraints

- <Tech-stack / architecture constraints this must respect — e.g. "new schema in @shared/config", "must go through the BFF, not direct Elysia calls", "CASL-gated">

## Affected Areas

- [ ] `apps/backend-boilerplate` (which module/triad)
- [ ] `apps/nextjs-boilerplate` (which feature/route)
- [ ] `shared/config` (which schema)
- [ ] `shared/neon` (schema/migration)

## Acceptance Criteria

<Testable, observable statements. These flow into the plan and are what /qa grades against.>

- [ ] <e.g. "POST /api/v1/posts/:id/reactions returns 401 without auth: true">
- [ ] <e.g. "a non-author gets 403 when reacting is restricted">

## Open Questions / Risks

- <Unresolved decisions, migration risk, breaking changes>
```

Keep it focused on _what_ and _why_. The _how_ (file paths, method signatures, ordered steps) belongs in `/plan`, not here.

### 4. Report back

Print the spec path and a one-line summary, then tell the user:

> Spec written to `docs/specs/<file>`. Run `/plan docs/specs/<file>` to turn it into an implementation plan.

## Notes

- Specs are committed docs (they live in `docs/`, not `.claude/`) so they're part of the project's history and reviewable in PRs.
- For quick brainstorming of an idea before it's spec-ready, the `superpowers:brainstorming` skill is the generic upstream tool; `/spec` is for capturing the agreed shape in this repo's format.
