---
description: Code conventions, patterns, and style requirements
---

# Conventions

The concrete "how to write code here" rules. `architecture.md` covers _where things live_; `principles.md` covers _why_. `oxfmt` owns pure style (single quotes, no semicolons, 2-space, 80 cols, no trailing commas) — these are the conventions it can't enforce.

- The backend uses ESM with explicit `.js` import extensions (`import { x } from './foo.js'`) even though sources are `.ts` — match this in `apps/backend-boilerplate`.
- Prefer the neverthrow `Result` pattern in backend services over throwing across layers; only throw `AppError` inside the `catchAsyncError`-wrapped body.
- Put shared types/schemas in `@shared/config` so both apps stay in sync.

## Code Style

- Prefer `const` arrow functions over `function` declarations: `const fn = () => {}` not `function fn() {}`. **Exception:** TypeScript function overloads require the `function` keyword (e.g., a utility with multiple call signatures); the `function` keyword is acceptable only in that case.
- Prefer `switch-case` over `else-if` chains when 3 or more branches test the same discriminant expression. For simple value-to-value mappings, prefer a `Record<K, V>` lookup table over both (exhaustiveness is enforced by the type).

## Validation

- Validate all external input (request `body` / `query` / `params`, headers, env) with a Zod schema at the boundary — for the backend that's the Elysia route options (e.g. `body: PostModel.createPostBody`), never inside a service.
- Schemas live in `@shared/config` as `*.model.ts` and are imported by both apps. Add new validation there, not in an app.

## Transactions

- Use `prisma.$transaction([...])` for any multi-step write that must be atomic.
- Services call `prisma` directly (there is no separate model layer). When a transaction spans helpers, thread the `tx` client (`Prisma.TransactionClient`) into each Prisma call rather than reaching for the singleton `prisma`.

## Auth Context

The auth/authorization mechanics (Cognito JWT via `authPlugin`, `getUserPermissions`, the BFF clients) are described in `architecture.md` — the rules here are just: gate protected routes with the `auth: true` macro, and enforce the resolved ability on **every** query (`accessibleBy(ability).ofType('<Model>')` in list `where` clauses, `ability.can('<action>', subject('<Model>', record))` on single resources). Authenticating without consulting the ability is broken authorization.

## Exports

Always use named exports, never default exports — except where Next.js requires a default export (pages, layouts, route segments, middleware).

## Frontend Components (nextjs-boilerplate)

- Use CVA (`class-variance-authority`) for variant systems in atoms and organisms; co-export `<Name>Variants` alongside the component for consumers that need raw class strings.
- Mark each component's root element with `data-slot="<component-name>"` (e.g. `data-slot="button"`) to enable parent styling via attribute selectors.
- Compose subcomponents (e.g. `Card`, `CardHeader`, `CardContent`) as separate named exports from a single file — not separate files.
- Atoms and molecules carry no `'use client'` directive by default; add it only when event handlers, hooks, or browser APIs are genuinely required.
- Feature-specific components go in `features/<name>/client/components/` (client) or `features/<name>/server/components/` (server); never in `src/components/`.
- Server components (`features/<name>/server/components/`) must have no `'use client'`, no React hooks, and no browser APIs.

## Rendering (nextjs-boilerplate)

Cache Components is enabled (`cacheComponents: true` in `next.config.ts`). It replaces the old route-segment config for controlling rendering.

- **Never use `export const dynamic = 'force-dynamic'`** (nor the sibling segment configs `revalidate`, `fetchCache`, `dynamicParams` used for the same purpose). Under Cache Components these are the wrong tool — dynamic-ness is driven by _accessing request data_, not by a segment flag.
- To opt a Server Component into dynamic rendering, access request data at the top of the component **before** any non-deterministic call: `await connection()`, `cookies()`, `headers()`, or `await params` / `searchParams`. This access must precede any `Date.now()`, `Math.random()`, or uncached `fetch()` in that render, or the production build fails to prerender (`used Date.now() before accessing … Request data`). See `app/(public)/(main)/posts/page.tsx` calling `await connection()` before `fetchAllPosts()`.
- Wrap genuinely cacheable work in `'use cache'` rather than forcing the whole route dynamic.

## Error Handling

The pipeline itself (`catchAsyncError` → `ResultAsync<T, AppError>` → `handleApiError` → `errorHandler`, error codes from `@shared/config`) is described in `architecture.md`. Conventions on top of it:

- Prefer the shared `catchError` utils over hand-written `try/catch`. Choose by intent: `catchAsyncError(promise)` reports to Sentry — use it when a throw is genuinely exceptional; `catchSyncError(() => …)` does not — use it for expected, recoverable failures (input validation, parsing untrusted data, `new URL(...)`, `JSON.parse`). Each app has its own copy: backend `src/error/utils/catchError.ts`, frontend `src/features/error/utils/catchError.ts`.
- Handle Results as values (`.match(...)`, `.unwrapOr(...)`); reserve raw `try/catch` for cases the helpers can't express. Never leak internal stack traces in responses.
