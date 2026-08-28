# Project Architecture

## Overview

Turborepo monorepo on **Bun** (package manager + runtime). Two apps and shared packages:

- `apps/backend-boilerplate` — Elysia REST API (Bun runtime), deployed as a Lambda container.
- `apps/nextjs-boilerplate` — Next.js 16 / React 19 app that acts as a **BFF** (Backend-for-Frontend) in front of the Elysia API.
- `shared/config` — Zod schemas (`*.model.ts`), shared error definitions. Published as `@shared/config`.
- `shared/neon` — Prisma client for Neon serverless Postgres. Published as `@shared/neon`.
- `shared/typescript-config` — base tsconfigs extended via `extends`.

Workspaces are `apps/*` and `shared/*`. Cross-package deps use `workspace:*`.

## Backend (`apps/backend-boilerplate`)

Elysia app composed from plugins. Entry is `src/index.ts`: load secrets → mount logger/helmet/cors → `.use(routes)`.

**Module layout** under `src/modules/<name>/`:

- `*.plugin.ts` — an Elysia plugin that `.decorate()`s the service(s) onto the context.
- `*.controller.ts` — defines routes, `.use()`s its plugin + `authPlugin` + `errorHandler` + `openapi`. Validates with Zod schemas from `@shared/config` (e.g. `PostModel.createPostBody`). Wraps every service call in `handleApiError(...)`.
- `*.service.ts` — pure data logic. Returns `ResultAsync<T, AppError>` (neverthrow), never throws to the caller.

Routes are aggregated in `src/routes/index.ts` under prefix `/api/v1`; OpenAPI/Swagger is served there.

**Error handling:**

- Services wrap promises in `catchAsyncError(promise)` (`src/error/utils/catchError.ts`), which returns a `ResultAsync` and maps any thrown value to an `AppError` via `mapToAppError` (also captures to Sentry).
- Inside service logic, signal failures by `throw new AppError('NOT_FOUND' | 'FORBIDDEN' | ..., msg)`. Error codes are defined in `@shared/config` (`errorDefinition`).
- Controllers call `handleApiError(resultAsync)`, which awaits the Result and re-throws `result.error`; the mounted `errorHandler` plugin converts it to the HTTP response.

**Auth & authorization:**

- `authPlugin` (`src/modules/auth/auth.plugin.ts`) exposes an `auth: true` route macro. It reads a Bearer token, **falling back to the `X-Id-Token` header** (SSR/Lambda calls put the SigV4 signature in `Authorization`). It verifies the Cognito JWT (`jose`) and resolves `user: AuthUser` (`cognitoSub`, `email`, `role` from `cognito:groups`).
- Authorization is **CASL + Prisma**. `getUserPermissions(user?, userId?)` (`src/modules/auth/permission.ts`) builds an `AppAbility`. Services receive the ability and enforce it two ways: `accessibleBy(ability).ofType('Post')` in `where` clauses for list queries, and `ability.can('update', subject('Post', post))` for single-resource checks. Unauthenticated callers get read-only public permissions.

Secrets: in production, `loadSecrets()` pulls `DATABASE_URL` from AWS Secrets Manager (`DATABASE_URL_SECRET_NAME`); in dev it reads `.env`. Env is validated with `@t3-oss/env-core` in `src/config/env.ts`.

## Frontend (`apps/nextjs-boilerplate`)

Next.js App Router. The app is a **BFF**: browser code never calls the Elysia backend directly — it calls Next.js route handlers / server components, which forward to Elysia server-side with the auth token attached.

**Routing groups** under `src/app/`:

- `(authorized)/` — pages requiring a session. `(public)/` — open pages and the auth flow.
- `api/` — route handlers. These are thin: they call a feature's `server/api` function and `NextResponse.json` the result.

**Feature modules** under `src/features/<name>/` are split by execution context:

- `server/api/` — calls the Elysia backend via the shared `ky` clients in `src/lib/serverApiClient.ts`. Use `serverApiClient` for unauthenticated GETs and `serverAuthApiClient` for authenticated calls (it injects the Cognito ID token as `X-Id-Token` and, in production, SigV4-signs the request to the Lambda Function URL — order matters; see comments in that file).
- `client/` — `'use client'` components, hooks, and client-side API callers.
- `schemas/` — Zod; `lib/`, `utils/`, `constants/`, `providers/`.

**Component system** (`src/components/`): Atomic-design layers for cross-feature shared UI:

- `atoms/` — primitives (Button, Input, Label, Skeleton, Spinner…); CVA for variants; root element marked `data-slot="<name>"`.
- `molecules/` — composites of atoms (Card, Avatar, AlertDialog, Tabs…); may expose named subcomponents (e.g. `Card` + `CardHeader` + `CardContent` from one file).
- `organisms/` — complex interactive components combining molecules (Field, ActionButton); may own local state and handlers.
- `layout/` — page structure blocks (`PageTemplate`, `PageHeader`, `DynamicMarker`).
- `common/` — marketing/cross-page sections (`HeroSection`, `FeatureSection`).

Atoms never import from molecules or organisms. Molecules import atoms only. Feature-specific UI belongs in `features/<name>/client/components/` or `features/<name>/server/components/`, not in `src/components/`.

**Auth flow** (`src/features/auth/`): OIDC with Cognito using `openid-client` + PKCE. State lives in **two** `iron-session` HttpOnly cookies — transient PKCE state in `auth_pkce`, and the completed session (holding only the refresh token) in `auth_session`. `src/proxy.ts` is the Next.js middleware that gates `PROTECTED_ROUTES` (redirects to login if `auth_session` is absent) — it only checks cookie _presence_, not validity; real verification happens in the backend. Read [`docs/authentication.md`](../../docs/authentication.md) — the implementation-level flow (mermaid diagrams for login/callback/authenticated-call/logout, the two-cookie model, CASL) — before changing anything in `features/auth/`, the BFF clients, or `proxy.ts`.

Authorization mirrors the backend with CASL (`@casl/react`, `src/lib/casl.ts`, `PermissionProvider`).

**Environment variables — build once, deploy many.** `src/config/env.ts` uses `@t3-oss/env-core` (not `env-nextjs`) — every variable is a **server-only** runtime value read from `process.env`, matching the backend's `env.ts` pattern. **Never add a `NEXT_PUBLIC_*` variable**: Next.js inlines those into the JS bundle at build time, which permanently binds one built Docker image to a single environment and breaks promoting the same image from dev to prod unchanged. If the browser genuinely needs a config value at runtime (e.g. the Sentry DSN), expose it through a runtime endpoint instead — see `app/api/config/route.ts` (a thin, `connection()`-gated route handler) and its consumer `src/instrumentation-client.ts` (fetches it client-side, initializes lazily). Client code needing the app's own origin uses same-origin relative paths (`/api/...`), never an absolute base URL from env.

UI is shadcn/ui + Tailwind CSS 4. Import alias is `@/*` → `src/*`.

## Shared packages

- **`@shared/config`** — single source of truth for request/response shapes. Schemas live in `src/schemas/*.model.ts` and are imported by both apps for validation and types. Add new validation here, not in an app.
- **`@shared/neon`** — exports a singleton `prisma` client (`src/client.ts`) using the Neon serverless adapter (WebSocket via `ws`). Schema is `prisma/schema.prisma`; generated client is git-ignored and produced by `db:generate` (neon's `prebuild`, so building the package regenerates it).

## Infra & deploy

- `infra/` — `bootstrap/`, `backends/`, `vars/`, `modules/`. `docs/` contains the AWS architecture (CloudFront → Next BFF + S3 + Elysia Lambda + Cognito + Neon), CloudFront, Lambda IAM auth, and Terraform pipeline notes — read `docs/architecture.md` before changing deployment topology.
- Both apps ship a `Dockerfile` and `vercel.json`; backend deploys as a Lambda container image via CodeDeploy blue/green (see architecture doc).
