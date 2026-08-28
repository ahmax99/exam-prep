# Project Architecture

## Overview

Turborepo monorepo on **Bun** (package manager + build tool — the app itself runs on the **Node.js** runtime). One workspace:

- `apps/nextjs` — Next.js / React app. It is the only server: Server Components and route handlers do their own data access directly (Postgres via Prisma, S3 via the AWS SDK) — there is no separate backend service to call.

Workspaces are `apps/*`. There is no `shared/` — with a single app, a shared package would only exist to be imported by one consumer, so Prisma, its schema, and the base tsconfig all live directly in `apps/nextjs`.

This repo used to ship a second app, a separate Elysia REST API deployed as its own Lambda (`apps/backend-boilerplate`), with the Next.js app acting as a BFF that forwarded requests to it over a SigV4-signed Lambda Function URL. That backend has been removed — everything it did (S3 access, Postgres access) now happens in-process inside `apps/nextjs`. If this repo ever needs a genuinely separate backend service again (a different runtime, independent scaling, a language boundary), that's new design work, not a restore: the old Elysia plugin/controller/service triad and the SigV4 Lambda-to-Lambda wiring are gone from both the code and `infra/`.

## Frontend (`apps/nextjs`)

Next.js App Router. Browser code never talks to Postgres or S3 directly — it renders Server Components or calls this app's own route handlers, both of which run server-side and own that access directly (no forwarding to another service).

**Routing groups** under `src/app/`:

- `(public)/` — all current pages live here (there is no session concept, so nothing is gated).
- `api/` — route handlers. These are thin: they call a feature's `server/api` function and `NextResponse.json` the result.

**Feature modules** under `src/features/<name>/` are split by execution context:

- `server/` — server-only code (Server Components, route-handler logic). `server/api/` holds a feature's server-side logic — direct Postgres queries via `src/lib/prisma.ts`, direct S3 calls via the AWS SDK, or any other resource access; it's the deep module hiding how that's done from the route handler that calls it.
- `client/` — `'use client'` components, hooks, and client-side API callers.
- `schemas/` — Zod; `lib/`, `utils/`, `constants/`, `providers/`.

**Component system** (`src/components/`): Atomic-design layers for cross-feature shared UI:

- `atoms/` — primitives (Button, Separator, Skeleton…); CVA for variants; root element marked `data-slot="<name>"`.
- `molecules/` — composites of atoms (AlertDialog, Logo…); may expose named subcomponents (e.g. `Card` + `CardHeader` + `CardContent` from one file, when a molecule needs one).
- `organisms/` — complex interactive components combining molecules; may own local state and handlers. Currently empty — every prior organism (forms, auth-gated actions) was deleted with the features that used them; the layer stays as the designated home for the next one.
- `layout/` — page structure blocks (`PageTemplate`, `PageHeader`, `DynamicMarker`).
- `common/` — marketing/cross-page sections (`HeroSection`).

Atoms never import from molecules or organisms. Molecules import atoms only. Feature-specific UI belongs in `features/<name>/client/components/` or `features/<name>/server/components/`, not in `src/components/`.

This app has no authentication — there is no `features/auth/`, no session cookie, and no middleware gating routes. If a feature needs a signed-in user, that's new design work: pick an auth provider and flow, decide where session state lives, and re-derive an authorization model before assuming a caller identity anywhere in `server/`.

**Error handling:** `features/error/utils/catchError.ts` provides `catchAsyncError` (neverthrow `ResultAsync`, for genuinely exceptional failures) and `catchSyncError` (for expected, recoverable failures — input validation, parsing untrusted data). `features/error/lib/AppError.ts` + `constants/errorDefinition.ts` define the app's error codes (this used to be shared with the backend via `@shared/config`; now that there's only one app, it's inlined here). Route handlers wrap their logic in `withRequestLogging` (`src/lib/requestLogging.ts`), which itself calls `catchAsyncError` and converts a thrown `AppError` into a JSON error response — so a route handler can just `throw new AppError(...)` and let that wrapper handle the response.

**Environment variables.** `src/config/env.ts` uses `@t3-oss/env-core` (not `env-nextjs`) — every variable is a **server-only** runtime value read from `process.env`. **Never add a `NEXT_PUBLIC_*` variable**: Next.js inlines those into the JS bundle at build time, which permanently bakes one environment's values into that build. If the browser genuinely needs a config value at runtime, expose it through a thin, `connection()`-gated route handler instead and fetch it client-side rather than baking it into the bundle. Client code needing the app's own origin uses same-origin relative paths (`/api/...`), never an absolute base URL from env.

UI is shadcn/ui + Tailwind CSS 4. Import alias is `@/*` → `src/*`.

## Database

`src/lib/prisma.ts` exports `getPrismaClient()`, an async accessor that resolves `DATABASE_URL` (from Secrets Manager in deployed environments, `env.DATABASE_URL` locally) once and caches the real client using the Neon serverless adapter (WebSocket via `ws`) — `server/api` code awaits it, it isn't a synchronous singleton. Schema is `apps/nextjs/prisma/schema.prisma`; generated client is git-ignored and produced by `db:generate` (the app's own `prebuild`, so building regenerates it).

`schema.prisma` currently has zero models and nothing calls `getPrismaClient()` — this is deliberate scaffolding (like the empty `organisms/` layer above), kept wired end-to-end (schema, client, migrations, `db:*` scripts) so the first real feature only has to add a model and a caller, not stand up the database layer from scratch.

Add new validation/schemas/config directly in `apps/nextjs` (there's only one consumer, so there's no cross-app sync problem a shared package would solve). If a second app is ever added back, that's the point to extract shared code into a `shared/` package — not before.

## Infra & deploy

- `infra/` — `bootstrap/`, `backends/`, `vars/`, `modules/`. `docs/` contains the AWS architecture (Amplify Hosting → Neon + S3), IAM, and Terraform pipeline notes — read `docs/architecture.md` before changing deployment topology.
- The app deploys on **AWS Amplify Hosting** (`platform = WEB_COMPUTE`), which owns its own CDN, build, and SSR compute — there is no Dockerfile, no container image, and no separate CDN or edge-function layer for this Terraform to manage. Amplify's own GitHub build webhook triggers a deploy on push; the build spec is the repo-committed root `amplify.yml`. There is **no CodeDeploy, no blue/green, no canary, and no automatic rollback** — recovery from a bad release is redeploying a previous build (see `docs/deployment-environments.md#rollback`).
- A WAFv2 Web ACL (`infra/modules/waf`) is associated directly with the Amplify app — no CloudFront distribution needed, since `aws_wafv2_web_acl_association`'s `resource_arn` accepts an Amplify app ARN directly. Amplify only accepts a `CLOUDFRONT`-scope Web ACL (confirmed against AWS's own docs after a `REGIONAL`-scope attempt failed with `WAFInvalidParameterException: The resource is not supported in current region`) — AWS manages `CLOUDFRONT` scope exclusively via the `us-east-1` endpoint regardless of the app's own region, hence the `aws.waf` provider alias in `infra/providers.tf`. It runs AWS Managed Rules (Core Rule Set + Known Bad Inputs) in count-only mode (`override_action { count {} }`) pending a review of CloudWatch metrics before switching to enforce. There is still **no maintenance mode** — nothing in Terraform or CI can put the site behind a "down for maintenance" page.
