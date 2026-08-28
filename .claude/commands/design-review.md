---
name: design-review
description: Comprehensive design review of UI changes — impeccable critique + audit driven through a real browser via Playwright
---

Conduct a design review of the current UI changes (this branch vs `origin/main`,
or the scope the user names).

This command reviews **design quality** — visual hierarchy, consistency,
responsiveness, accessibility, polish. Code correctness is `/qa`'s job; don't
duplicate it here.

## Prerequisites

1. Identify the changed UI surface: `git diff origin/main --stat` filtered to
   `apps/nextjs-boilerplate/src/` — note the pages/components touched and which
   routes render them.
2. Ensure the dev server is running (`turbo dev --filter=nextjs-boilerplate`,
   default http://localhost:3000). Start it in the background if it isn't.
3. This review leans on the impeccable plugin. If `/impeccable` is unavailable,
   say so and run only the manual phases below.

## Review phases

1. **Critique** — run `/impeccable critique` against the changed routes: UX
   hierarchy, clarity, information architecture, emotional resonance.
2. **Audit** — run `/impeccable audit` for the technical checks: accessibility
   (WCAG 2.1 AA), performance, responsive behavior, anti-pattern detection.
3. **Browser verification (Playwright)** — for each changed route: navigate,
   snapshot, and check at desktop (1440px), tablet (768px), and mobile (375px)
   widths; exercise the primary interaction flows (forms submit, dialogs open,
   states change); capture the console for errors/warnings.
4. **Convention check** — verify the diff respects the shadcn skill's critical
   rules (semantic tokens, no raw hex, component composition) and repo placement
   rules (atomic-design layers, feature folders, CVA, `data-slot`).

## Report

Produce a markdown report with findings categorized as:

- **Blockers** — broken flows, inaccessible controls, unusable on a viewport
- **High-Priority** — clear design defects: contrast failures, hierarchy
  problems, missing loading/empty/error states
- **Medium-Priority** — inconsistencies with the design system or conventions
- **Nitpicks** — prefix with "Nit:"; polish suggestions

For each finding: the route/component, what's wrong, and the concrete fix.
Lead the report with a one-paragraph overall verdict.
