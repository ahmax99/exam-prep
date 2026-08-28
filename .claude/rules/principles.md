---
description: Engineering principles — clean code + A Philosophy of Software Design. Applied to all new code unless a tech-stack doc says otherwise.
---

# Engineering Principles

These are the non-negotiable design principles for this repo, drawn from _clean code_ and John Ousterhout's _A Philosophy of Software Design_. They guide every implementation and every review.

> **Precedence rule:** if an official tech-stack doc (Elysia, Next.js, Prisma, Zod, CASL, oxlint/oxfmt) recommends something that conflicts with a principle here, **follow the tech-stack doc** and note the deviation. These principles lose to framework idioms, not the other way around. They also lose to `.claude/rules/architecture.md` and `conventions.md`, which describe what this codebase actually does.

## Complexity is the enemy

The goal is not "fewer lines" — it's lower complexity: less for the next reader to hold in their head.

- **Zero-tolerance for unnecessary complexity.** If a change makes the system harder to understand for no functional gain, it's wrong.
- **Complexity is incremental.** It accrues one "this is fine" at a time. Push back on small messes before they compound.
- Prefer the design that makes the _common_ case obvious, even if it makes a rare case slightly more verbose.

## Deep modules

A module's value is its functionality divided by its interface. Maximize the first, minimize the second.

- **Deep > shallow.** A simple interface that hides real work (this repo's `*.service.ts` returning a `ResultAsync`, the `catchAsyncError` wrapper, `serverAuthApiClient`) beats a thin pass-through that just forwards calls. Flag shallow wrappers that add an interface without hiding anything.
- **Information hiding.** Each module hides a design decision behind its interface. Leaking that decision to callers (so they must know the internals to use it) is a red flag.
- **General-purpose beats special-purpose.** A slightly more general interface usually ends up simpler _and_ more reusable than one tailored to today's single caller.

## Define errors out of existence

- Prefer designs where exceptional cases simply can't arise over designs that detect-and-handle them everywhere.
- In the backend, that means the neverthrow `Result` flow: services return `ResultAsync<T, AppError>` and the error path is a value, not a thrown exception scattered across layers. Don't reintroduce `try/catch` ladders that the pipeline already removes.
- Aggregate handling at a boundary (the `errorHandler` plugin, the BFF route handler) instead of repeating it per call site.

## Comments and naming carry the design

- **Comments explain WHY, not WHAT.** The code already says what it does. Comments capture intent, invariants, and the non-obvious (why this order, why this guard, why not the simpler approach).
- **Keep comments short — one line, ideally.** If the WHY needs multiple lines or a paragraph to explain, that's a sign the design is too complex, not that the comment needs more room.
- Write the interface comment that lets a caller use a function _without reading its body_. If you can't, the abstraction is leaking.
- Names are the cheapest documentation: precise, consistent, no abbreviations that need a decoder.

## Work that pays down complexity

- **Design it twice.** For anything non-trivial, sketch two approaches before committing. The second is usually better and the comparison sharpens both.
- **Strategic, not tactical.** Leave each file slightly better than you found it when you're already working in it — but don't bundle unrelated refactors into a feature change.
- **Consistency.** Match the patterns already in the touched area. A locally-novel "better" pattern raises complexity more than it helps; propose it separately.

## What this looks like here

- New backend resource → full triad (`*.plugin.ts` + `*.controller.ts` + `*.service.ts`), logic in the service, controller thin.
- New external input → one Zod schema in `@shared/config`, validated at the boundary.
- New shared type → `@shared/config`, so both apps stay in sync.
- `any` is banned (oxlint `typescript/no-explicit-any` error) — reach for generics, unions, or `unknown` + narrowing.
- Frontend stays behind the BFF boundary.
