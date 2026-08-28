# Boilerplate Template

Modern full-stack monorepo boilerplate built with Turborepo, Bun, and TypeScript.

## Tech Stack

### Runtime & Build Tools

- **[Bun](https://bun.sh/)** - Fast all-in-one JavaScript runtime and package manager
- **[Turborepo](https://turbo.build/repo)** - High-performance build system for monorepos
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript

### Backend

- **[Elysia](https://elysiajs.com/)** - Fast and ergonomic web framework for Bun
- **[Prisma](https://www.prisma.io/)** - Type-safe ORM with Neon adapter
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation

### Frontend

- **[Next.js](https://nextjs.org/)** - React framework with App Router
- **[React](https://react.dev/)** - UI library with Server Components
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - Re-usable component library
- **[React Hook Form](https://react-hook-form.com/)** - Form validation
- **[Zustand](https://zustand-demo.pmnd.rs/)** - State management

### Database & Caching

- **[Neon](https://neon.tech/)** - Serverless PostgreSQL

### Authorization & Storage

- **[CASL](https://casl.js.org/)** - Isomorphic authorization library
- **[AWS S3](https://aws.amazon.com/s3/)** - Object storage for file uploads

### Code Quality

- **[oxc](https://oxc.rs/)** (oxlint + oxfmt) - Fast linter and formatter
- **[hadolint](https://github.com/hadolint/hadolint)** - Dockerfile linter (best-practice + security rules), local-only via the pre-commit hook (no CI gate)
- **[Lefthook](https://lefthook.dev/)** - Git hooks (pre-commit runs oxfmt/oxlint + hadolint on staged files + `terraform fmt`)
- **[fallow](https://docs.fallow.tools/)** - Static analysis for unused code, duplication, complexity, and architecture drift
- **[sonarqube](https://docs.sonarsource.com)** - Continuous inspection platform used to automate code reviews and detect bugs, security vulnerabilities, and code smell

## Prerequisites

In addition to [Bun](https://bun.sh/), this repo uses [graphify](https://github.com/safishamsi/graphify) to maintain a persistent codebase knowledge graph for AI-assisted development.

**One-time setup** (requires Python 3.10+ and [`uv`](https://docs.astral.sh/uv/getting-started/installation/)):

```bash
bun run graphify:install   # install graphify via uv
bun run graphify:build     # generate graphify-out/ (uses graphify update — no API key needed)
```

After this, the graph rebuilds automatically after every commit via a Lefthook post-commit hook. `graphify-out/` is gitignored (not committed), so run `bun run graphify:build` once after cloning to generate it.

> If `bun run graphify:build` prompts for an API key or errors on Markdown files, add `docs/` to `.graphifyignore` and re-run.

## Codebase Atlas

An isometric map of the whole repo: 34 subsystems as city blocks, each sized by its measured
line count, wired together by the calls and data that actually flow between them. Click any
block for what it does and how it's built, go inside the big ones for their breakdown, or play
one of three end-to-end traces — publishing a post with an image, signing in, and shipping a
release to production.

It is a single self-contained file, so open
[`docs/atlas/atlas.html`](docs/atlas/atlas.html) straight in a browser, or serve it with:

```bash
bun run atlas    # http://localhost:8731/atlas.html
```

Every number on the page is measured from the working tree, not estimated. See
[docs/atlas/README.md](docs/atlas/README.md) for how it was measured and how to refresh it as
the code changes.

## Workspace Structure

> This is a high-level summary. Internal architecture (module layout, auth flow, error handling, BFF data flow) is documented for contributors in `.claude/rules/architecture.md`. For a visual overview, see the [Codebase Atlas](#codebase-atlas) above.

## Monorepo Features

- **Shared dependencies** - Common packages reused across apps
- **Incremental builds** - Only rebuild what changed
- **Parallel execution** - Run tasks across packages simultaneously
- **Type safety** - End-to-end TypeScript support
- **Code sharing** - Share schemas, types, and utilities

### Apps (`apps/`)

#### `backend-boilerplate`

RESTful API built with Elysia and Bun runtime.

**Features:**

- Post and comment management
- S3 presigned URL generation for image uploads
- CASL-based authorization
- OpenAPI/Swagger documentation
- Rate limiting and bot detection

**Tech:** Elysia, Prisma, CASL, AWS SDK

#### `nextjs-boilerplate`

Modern full-stack Next.js application with authentication and file uploads.

**Features:**

- OIDC authentication with Cognito
- Role-based authorization with CASL
- S3 file uploads with presigned URLs
- Transactional emails with Resend
- Error monitoring with Sentry

**Tech:** Next.js 16, React 19, CASL, Tailwind CSS 4, shadcn/ui, React Hook Form, Zod, Zustand

### Shared Packages (`shared/`)

#### `@shared/config`

Shared configuration package containing Zod schemas, type definitions, and error constants.

**Exports:**

- Post and Comment validation schemas
- Email validation utilities
- Standardized error definitions (NOT_FOUND, UNAUTHORIZED, etc.)

#### `@shared/neon`

Prisma client configured for Neon serverless PostgreSQL.

**Features:**

- Neon serverless adapter with connection pooling
- WebSocket support for real-time capabilities
- Global singleton pattern
- Database migration and seeding scripts

#### `@shared/typescript-config`

Shared TypeScript configurations used across the monorepo.

## Getting Started

### Using this template

Click **Use this template → Create a new repository** on GitHub, or via the CLI:

```bash
gh repo create my-app --template ahmax99/boilerplate-template --private
```

Then clone your new repo and continue with the steps below.

### Prerequisites

- **Bun** >= 1.3.8
- **Node.js** >= 24

### Installation

Install dependencies:

```bash
bun install
```

### Development

Start all apps and packages in development mode:

```bash
bun run dev
```

Start a specific app:

```bash
turbo dev --filter=backend-boilerplate
```

### Build

Build all apps and packages:

```bash
bun run build
```

Build a specific package:

```bash
turbo build --filter=@shared/neon
```

### Other scripts

Type checking, oxc formatting/linting, package-version syncing and update checks are all defined as scripts — see the root and per-package `package.json` for the full, authoritative list (e.g. `check-types`, `check-format`, `format`, `check-mismatches`, `sync-packages`).

## Environment Setup

Each package requiring environment variables includes an `.env.example` file:

- **`shared/neon`** - Requires `DATABASE_URL` for Neon PostgreSQL
- **`apps/backend-boilerplate`** and **`apps/nextjs-boilerplate`** - See app-specific `.env.example` for full configuration

Copy `.env.example` to `.env` in each package and fill in your credentials.

## Deployment

The app deploys to AWS (Lambda containers behind CloudFront) across two member
accounts (`dev`, `prod`) plus a shared-services account hosting the central
ECR registry and DNS apex zone. To bring up an environment from scratch —
prerequisites, GitHub variables/secrets, state-bucket bootstrap, and the first
applies — follow [**docs/runbook.md**](docs/runbook.md). The reference for how
the environments and pipelines work is
[docs/deployment-environments.md](docs/deployment-environments.md), with the
underlying AWS architecture in [docs/architecture.md](docs/architecture.md).

## AI-Driven Development

This template ships with a [Claude Code](https://claude.com/claude-code) harness
for building features spec-first with an AI agent (`brainstorm → /spec` → `/plan` → `/implement` → `/qa`). New here? Start with
[**docs/ai-driven-development.md**](docs/ai-driven-development.md).
