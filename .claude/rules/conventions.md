---
description: Code conventions, patterns, and style requirements
---

# Conventions

The concrete "how to write code here" rules. `architecture.md` covers _where things live_; `principles.md` covers _why_. `oxfmt` owns pure style (single quotes, no semicolons, 2-space, 80 cols, no trailing commas) — these are the conventions it can't enforce.

- `server/api` functions throw `AppError` and let the boundary (`withRequestLogging`, `app/error.tsx`) handle it; the neverthrow `Result` pattern is for boundaries and client code — see Error Handling below.
- Put shared types/schemas next to the feature that owns them, under `features/<name>/schemas/`. There's one app, so there's no cross-app sync problem a shared package would solve.

## Code Style

- Prefer `const` arrow functions over `function` declarations: `const fn = () => {}` not `function fn() {}`. **Exception:** TypeScript function overloads require the `function` keyword (e.g., a utility with multiple call signatures); the `function` keyword is acceptable only in that case.
- Prefer `switch-case` over `else-if` chains when 3 or more branches test the same discriminant expression. For simple value-to-value mappings, prefer a `Record<K, V>` lookup table over both (exhaustiveness is enforced by the type).

## Validation

- Validate all external input (route handler `body` / `query` / `params`, headers, env) with a Zod schema at the boundary, never inside `server/api` logic.
- Schemas live in `features/<name>/schemas/*.schema.ts`, colocated with the feature that validates against them.

## Transactions

- Use `prisma.$transaction([...])` for any multi-step write that must be atomic.
- `server/api` code imports `prisma` from `@/lib/prisma` and queries it directly — there is no separate model layer. When an interactive transaction spans helpers, thread the `tx` client (`Prisma.TransactionClient`) into each Prisma call rather than using `prisma`.

## Exports

Always use named exports, never default exports — except where Next.js requires a default export (pages, layouts, route segments, middleware).

## Frontend Components (nextjs)

- Use CVA (`class-variance-authority`) for variant systems in atoms and organisms; co-export `<Name>Variants` alongside the component for consumers that need raw class strings.
- Mark each component's root element with `data-slot="<component-name>"` (e.g. `data-slot="button"`) to enable parent styling via attribute selectors.
- Compose subcomponents (e.g. `Card`, `CardHeader`, `CardContent`) as separate named exports from a single file — not separate files.
- Atoms and molecules carry no `'use client'` directive by default; add it only when event handlers, hooks, or browser APIs are genuinely required.
- Feature-specific components go in `features/<name>/client/components/` (client) or `features/<name>/server/components/` (server); never in `src/components/`.
- Server components (`features/<name>/server/components/`) must have no `'use client'`, no React hooks, and no browser APIs.

## Rendering (nextjs)

Cache Components is **not** enabled — there is no `cacheComponents` flag in `next.config.mjs`, so this app follows Next.js's previous caching model (`app/guides/caching-without-cache-components` in the version-matched docs bundled at `node_modules/next/dist/docs/`).

- **`'use cache'`, `cacheLife`, and `cacheTag` are unavailable** — they are Cache Components features and error without the flag. Don't reach for them.
- Route segment configs (`dynamic`, `revalidate`, `dynamicParams`, `fetchCache`) are the supported lever here and are fine to use. Pick the narrowest one that states the intent — `export const revalidate = 3600` for merely time-sensitive data, `dynamic = 'force-dynamic'` only when a route is genuinely per-request.
- To opt a Server Component into dynamic rendering without a segment flag, access request data: `await connection()`, `cookies()`, `headers()`, or `await params` / `searchParams` (see `components/layout/DynamicMarker.tsx`).
- `fetch` is **not** cached by default; opt in per call with `{ cache: 'force-cache' }`.
- Cache Prisma queries and other non-`fetch` async work with `unstable_cache` from `next/cache`, passing a `tags` array so `revalidateTag` can invalidate it on write.

## Error Handling

The pipeline itself (`server/api` throws `AppError` → `withRequestLogging` for routes, `app/error.tsx` + `instrumentation.ts` for pages; codes in `features/error/constants/errorDefinition.ts`) is described in `architecture.md`. Conventions on top of it:

- Don't wrap `server/api` functions in `catchAsyncError` or return `ResultAsync` from them, and don't add per-page `log.error` + fallback UI: the boundary already logs and renders the failure. Use `orNotFound(...)` in a page when a `NOT_FOUND` should render the 404 page.
- A page catches an error itself only when it renders something specific for it (e.g. the drill launcher's "Nothing to drill" for `NOT_FOUND`); it does that with `catchAsyncError(...)` and rethrows anything else.
- Prefer the shared `catchError` utils (`src/features/error/utils/catchError.ts`) over hand-written `try/catch`: `catchAsyncError(promise)` for async work at a boundary or in client code; `catchSyncError(() => …)` for expected, recoverable failures (parsing untrusted data, `new URL(...)`, `JSON.parse`).
- Client code handles Results as values (`.match(...)`, `.unwrapOr(...)`). Never leak internal stack traces in responses.
