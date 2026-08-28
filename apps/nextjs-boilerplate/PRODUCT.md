# Product

<!-- BASELINE: this file describes the boilerplate's demo app as a deliberately
neutral starting point. When you derive a new app from this template, re-run
`/impeccable init` and replace this file with the real product's context. -->

## Register

product

## Users

Developers and small teams who clone this template to ship a full-stack app
(Next.js BFF + Elysia API + Cognito auth + Neon Postgres). The demo surfaces —
posts with comments, account management, auth flows, a marketing landing page —
exist to be extended or replaced, not admired. Users of a derived app are in a
get-something-done workflow: reading, writing, managing their own records.

## Product Purpose

A production-grade boilerplate whose demo app proves every architectural path
works end-to-end (auth, CRUD with authorization, file upload, forms with
validation). Success: a developer can rename the demo resources into their own
domain in hours, and the UI conventions survive that translation without
redesign.

## Brand Personality

Precise, quiet, technical. The interface recedes so content and actions carry
the screen. Confidence is expressed through restraint: hierarchy comes from
type weight, size, and spacing — not color. Emotionally the app should feel
calm and trustworthy, never promotional.

## Anti-references

- SaaS-template maximalism: purple-to-blue gradients, glassmorphism cards,
  hero-metric blocks, identical icon-heading-text card grids.
- The 2026 cream/beige "warm neutral" AI default; this system is strict
  monochrome by intent, not by omission.
- Dashboard clutter: decorative charts, badges, and stat tiles that don't
  answer a user question.

## Design Principles

1. **Neutral is the feature.** The baseline stays monochrome so a derived app
   can graft its own brand color onto the token layer without fighting the UI.
2. **Hierarchy without color.** Type scale, weight, and whitespace do the work;
   color is reserved for meaning (destructive, focus, data viz).
3. **Every state designed.** Loading (skeleton), empty, error, and disabled
   states ship with the component — no dead ends.
4. **Tokens are the only door.** Visual change happens in `src/styles/tokens/`;
   components consume semantic classes and never hardcode values.
5. **Prove it in the demo.** Any convention this template claims must be
   visible in a working demo screen.

## Accessibility & Inclusion

WCAG 2.1 AA: ≥4.5:1 body-text contrast (≥3:1 large text), full keyboard
navigation with visible focus rings, screen-reader labels on icon-only
controls, and `prefers-reduced-motion` alternatives for every animation.
