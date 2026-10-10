# Project Architecture

## Overview

Turborepo monorepo on **Bun** (package manager + build tool — the app itself runs on the **Node.js** runtime). One workspace:

- `apps/nextjs` — Next.js / React app. It is the only server: Server Components and route handlers do their own data access directly (Postgres via Prisma, S3 via the AWS SDK) — there is no separate backend service to call.

Workspaces are `apps/*`. There is no `shared/` — with a single app, a shared package would only exist to be imported by one consumer, so Prisma, its schema, and the base tsconfig all live directly in `apps/nextjs`.

This repo used to ship a second app, a separate Elysia REST API deployed as its own Lambda (`apps/backend-boilerplate`), with the Next.js app acting as a BFF that forwarded requests to it over a SigV4-signed Lambda Function URL. That backend has been removed — everything it did (S3 access, Postgres access) now happens in-process inside `apps/nextjs`. If this repo ever needs a genuinely separate backend service again (a different runtime, independent scaling, a language boundary), that's new design work, not a restore: the old Elysia plugin/controller/service triad and the SigV4 Lambda-to-Lambda wiring are gone from both the code and `infra/`.

## Frontend (`apps/nextjs`)

Next.js App Router. Browser code never talks to Postgres or S3 directly — it renders Server Components or calls this app's own route handlers, both of which run server-side and own that access directly (no forwarding to another service).

**Routing groups** under `src/app/`:

- `(public)/` — the shell pages: the dashboard, a certification overview, the drill launcher, a run summary, past runs, bookmarks. There is no session concept, so nothing is gated — the group name is about layout, not access.
- `(drill)/` — the drill screen itself, in its own group so it renders without the sidebar and tab bar. The question owns the viewport; that is the only reason the group exists.
- `api/` — route handlers. These are thin: they call a feature's `server/api` function and `NextResponse.json` the result.

**Feature modules** under `src/features/<name>/` are split by execution context:

- `server/` — server-only code (Server Components, route-handler logic). `server/api/` holds a feature's server-side logic — direct Postgres queries via `src/lib/prisma.ts`, direct S3 calls via the AWS SDK, or any other resource access; it's the deep module hiding how that's done from the route handler that calls it.
- `client/` — `'use client'` components, hooks, and client-side API callers.
- `schemas/` — Zod; `lib/`, `utils/`, `constants/`, `providers/`.

The eight features today: **drill** (the queue builder, the grader, the mastery transition, the card — by far the largest module in the app), **progress** (mastery roll-ups per certification and per objective), **catalog** (certifications, exams, topics), **bookmarks**, **media** (a read-only S3 image proxy — nothing uploads), **error**, **metadata** (page titles) and **theme**. Pure decision logic that neither layer owns — queue ordering, grading, the mastery state machine — lives in `drill/lib/` as plain functions, not in `server/api`.

**Component system** (`src/components/`): Atomic-design layers for cross-feature shared UI:

- `atoms/` — primitives (Button, Separator, Skeleton…); CVA for variants; root element marked `data-slot="<name>"`.
- `molecules/` — composites of atoms (AlertDialog, Logo…); may expose named subcomponents (e.g. `Card` + `CardHeader` + `CardContent` from one file, when a molecule needs one).
- `organisms/` — complex interactive components combining molecules; may own local state and handlers (`Sidebar`, `ThemeToggle`).
- `layout/` — page structure blocks (`PageTemplate`, `PageHeader`, `AppSidebar`, `BottomTabBar`, `DynamicMarker`).

There is no `common/` layer — the marketing sections that justified one were deleted with the boilerplate content they belonged to. Don't reintroduce it for a single component.

Atoms never import from molecules or organisms. Molecules import atoms only. Feature-specific UI belongs in `features/<name>/client/components/` or `features/<name>/server/components/`, not in `src/components/`.

This app has no authentication — there is no `features/auth/`, no session cookie, and no middleware gating routes. If a feature needs a signed-in user, that's new design work: pick an auth provider and flow, decide where session state lives, and re-derive an authorization model before assuming a caller identity anywhere in `server/`.

**Error handling:** `features/error/utils/catchError.ts` provides `catchAsyncError` (neverthrow `ResultAsync`, for genuinely exceptional failures) and `catchSyncError` (for expected, recoverable failures — input validation, parsing untrusted data). `features/error/lib/AppError.ts` + `constants/errorDefinition.ts` define the app's error codes (this used to be shared with the backend via `@shared/config`; now that there's only one app, it's inlined here). Route handlers wrap their logic in `withRequestLogging` (`src/lib/requestLogging.ts`), which itself calls `catchAsyncError` and converts a thrown `AppError` into a JSON error response — so a route handler can just `throw new AppError(...)` and let that wrapper handle the response.

**Environment variables.** `src/config/env.ts` uses `@t3-oss/env-core` (not `env-nextjs`) — every variable is a **server-only** runtime value read from `process.env`. **Never add a `NEXT_PUBLIC_*` variable**: Next.js inlines those into the JS bundle at build time, which permanently bakes one environment's values into that build. If the browser genuinely needs a config value at runtime, expose it through a thin, `connection()`-gated route handler instead and fetch it client-side rather than baking it into the bundle. Client code needing the app's own origin uses same-origin relative paths (`/api/...`), never an absolute base URL from env.

UI is shadcn/ui + Tailwind CSS 4. Import alias is `@/*` → `src/*`.

## Database

`src/lib/prisma.ts` exports `getPrismaClient()`, an async accessor that builds the client from `env.DATABASE_URL` (a plain environment variable everywhere — `.env` locally, a Vercel env var when deployed) once and caches the real client using the Neon serverless adapter (WebSocket via `ws`) — `server/api` code awaits it, it isn't a synchronous singleton. Schema is `apps/nextjs/prisma/schema.prisma`; generated client is git-ignored and produced by `db:generate` (the app's own `prebuild`, so building regenerates it).

`schema.prisma` holds eight models and three enums. `Certification` → `Exam` → `Question` → `QuestionOption` is the catalog; `QuestionProgress` carries the per-question `MasteryState` (`WRONG` → `SHAKY` → `MASTERED`, two consecutive corrects to promote); `DrillRun` → `Attempt` is the history; `Bookmark` is the starred set. The catalog side is deliberately cert-agnostic — more certifications are planned, so don't let assumptions about the one currently seeded leak into shared code.

Question banks are seeded from JSON in the repo-root `data/` directory, which is **git-ignored** — the bank content is not committed. `prisma/seed.ts` validates every file against a Zod schema before writing a row, so a malformed bank fails loudly rather than landing half-loaded. There is no question-editing surface in the UI and none is planned.

Add new validation/schemas/config directly in `apps/nextjs` (there's only one consumer, so there's no cross-app sync problem a shared package would solve). If a second app is ever added back, that's the point to extract shared code into a `shared/` package — not before.

## Infra & deploy

- `infra/` — `bootstrap/`, `backends/`, `vars/`, `modules/`. `docs/` contains the architecture (Vercel → Neon + S3), IAM, and Terraform pipeline notes — read `docs/architecture.md` before changing deployment topology.
- The app deploys on **Vercel** (Hobby plan), git-connected to this repo: a push to `main` deploys production. Vercel owns the CDN, build, and serverless compute — there is no Dockerfile, no container image, and no CDN or edge layer for this Terraform to manage. The build spec is `apps/nextjs/vercel.json` (`prisma migrate deploy`, then `next build`). Recovery from a bad release is Vercel's Instant Rollback to a previous production deployment (see `docs/deployment-environments.md#rollback`); there is no blue/green, canary, or automatic rollback.
- The Vercel project itself (and the IAM role its functions assume via Vercel OIDC to read S3) is not in Terraform yet — it lands with the Vercel module. Until then `infra/` manages only the S3 bucket and the DNS plumbing. AWS Amplify Hosting, its WAF Web ACL, and the Secrets Manager database secret were the previous deployment and have been removed; don't reintroduce them. There is **no maintenance mode**.
