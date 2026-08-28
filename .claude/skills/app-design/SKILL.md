---
name: app-design
description: Design workflow for building UI in this monorepo and any app derived from this boilerplate. Use whenever creating, restyling, or reviewing any frontend UI — pages, components, layouts, forms, dashboards, landing pages, empty states, themes — or when starting the design of a new app, picking colors/typography, or mapping a design language into Tailwind/shadcn tokens. Use it even if the user just says "make this look better" or "build a page for X" without mentioning design.
---

# App Design (project glue)

This repo composes three design layers, listed here in precedence order. This
skill tells you which layer owns what, so guidance never conflicts:

1. **This repo's conventions** (`.claude/rules/architecture.md`,
   `conventions.md`) — placement and structure: atomic design layers, feature
   folders, CVA, `data-slot`, named exports, `'use client'` discipline. These
   win over everything below.
2. **impeccable plugin** (`/impeccable <command>`) — design quality: aesthetics,
   typography, color, motion, hierarchy, anti-patterns, critique/audit.
   It is the source of truth for _how the result looks and feels_.
3. **shadcn skill** (`.claude/skills/shadcn`) — component correctness: which
   component to use, composition rules, semantic tokens, forms, icons. It is
   the source of truth for _how components are written_.

**Precedence when they disagree:** repo conventions > impeccable > shadcn.
These layers mostly govern different axes — impeccable owns how it _looks_,
shadcn owns how components are _written_ — so genuine conflicts are rare. When
they do collide on aesthetics, impeccable leads: if impeccable's design
language calls for a different treatment than shadcn's default styling, follow
impeccable. But precedence over shadcn is not a licence to hand-roll: impeccable
never contests composition, so "use the real `Alert` and compose it, don't build
a bespoke styled div" still holds — apply impeccable's aesthetic (type scale,
palette restraint, anti-patterns) _on_ the correctly-composed component.

## Scenario 1: starting the design of a new app

When an app derived from this boilerplate needs its design language defined:

1. Run `/impeccable init`. It interviews for audience/brand-vs-product register
   and writes `PRODUCT.md` + `DESIGN.md`. Run it from the app directory
   (e.g. `apps/nextjs-boilerplate`), not the monorepo root, so the context
   lands next to the code it describes.
2. **Optional aesthetic seed:** if the user names a reference product ("feel
   like Linear/Vercel/Raycast"), fetch the matching `DESIGN.md` from
   https://github.com/voltagent/awesome-design-md (`design-md/<name>/DESIGN.md`
   on raw.githubusercontent.com) and use it as input to `init` — it carries
   real extracted tokens (colors, type scale, radii, spacing). Treat it as a
   reference, not a file to commit verbatim.
3. **Map tokens into the theme, never into components.** Whatever `DESIGN.md`
   defines, express it as shadcn semantic CSS variables in the app's global
   CSS (`@theme` block — Tailwind v4). Components keep using `bg-primary`,
   `text-muted-foreground`, etc. Raw hex in a component is always wrong; a
   reference design changes the _theme_, not the markup.

## Scenario 2: building UI

- Follow the shadcn skill's workflow first: check installed components, search
  registries before writing custom markup, compose rather than reinvent.
- For anything beyond a mechanical change — a new page, section, or component
  with real design decisions — use `/impeccable craft` (build) or
  `/impeccable shape` (plan UX before code).
- Place files per repo rules: shared cross-feature UI in `src/components/`
  (atoms → molecules → organisms → layout → common), feature-specific UI in
  `features/<name>/client|server/components/`. Variants via CVA; root element
  gets `data-slot`.
- In the spec → plan → implement → review flow, design work belongs in
  `/implement`; a plan step that says "build the settings page" implies this
  skill plus the shadcn skill.

## Scenario 3: improving or reviewing UI

- Targeted fixes: `/impeccable typeset` (fonts/hierarchy), `layout`
  (spacing/rhythm), `colorize`, `animate`, `bolder` / `quieter`, `harden`
  (error/edge/i18n states), `clarify` (UX copy).
- Review: `/design-review` (project command) runs impeccable's critique +
  audit against the running app with Playwright and reports
  Blockers/High/Medium/Nitpicks. `/qa` covers code correctness; `/design-review`
  covers design quality — run both before shipping UI.

## If impeccable is not installed

`/impeccable` commands require the impeccable plugin
(`/plugin marketplace add pbakaus/impeccable`, then
`/plugin install impeccable@impeccable`). If it's missing, say so and fall
back to the shadcn skill + repo conventions — don't silently skip the
design-quality pass.
