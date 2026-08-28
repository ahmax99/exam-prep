# Boilerplate Template

Modern full-stack monorepo boilerplate built with Turborepo, Bun, and TypeScript.

## Tech Stack

### Package Manager & Build Tools

- **[Bun](https://bun.sh/)** - Package manager and build/script runner (not the server runtime)
- **[Node.js](https://nodejs.org/)** - The runtime the app actually runs on, locally and in the deployed Lambda container
- **[Turborepo](https://turbo.build/repo)** - High-performance build system for monorepos
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript

### App

- **[Next.js](https://nextjs.org/)** - React framework with App Router
- **[React](https://react.dev/)** - UI library with Server Components
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - Re-usable component library
- **[React Hook Form](https://react-hook-form.com/)** - Form validation
- **[Zustand](https://zustand-demo.pmnd.rs/)** - State management
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation

### Database & Caching

- **[Neon](https://neon.tech/)** - Serverless PostgreSQL
- **[Prisma](https://www.prisma.io/)** - Type-safe ORM with Neon adapter

### Storage

- **[AWS S3](https://aws.amazon.com/s3/)** - Object storage for file uploads

### Code Quality

- **[oxc](https://oxc.rs/)** (oxlint + oxfmt) - Fast linter and formatter
- **[Lefthook](https://lefthook.dev/)** - Git hooks (pre-commit runs oxfmt/oxlint on staged files + `terraform fmt`)
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

An isometric map of the whole repo: each subsystem is a city block sized by its measured line
count, wired together by the calls and data that actually flow between them. Click any block
for what it does and how it's built, go inside the big ones for their breakdown, or play one
of the end-to-end traces.

> **The checked-in atlas is stale.** It still shows subsystems that have since been removed
> (the second backend app, WAF, CodeDeploy, maintenance mode, the static-assets bucket) and a
> sign-in trace for an auth layer this app no longer has. Regenerate it — see
> [docs/atlas/README.md](docs/atlas/README.md) — before trusting it.

It is a single self-contained file, so open
[`docs/atlas/atlas.html`](docs/atlas/atlas.html) straight in a browser, or serve it with:

```bash
bun run atlas    # http://localhost:8731/atlas.html
```

Every number on the page is measured from the working tree, not estimated. See
[docs/atlas/README.md](docs/atlas/README.md) for how it was measured and how to refresh it as
the code changes.

## Workspace Structure

> This is a high-level summary. Internal architecture (module layout, error handling, data access patterns) is documented for contributors in `.claude/rules/architecture.md`. For a visual overview, see the [Codebase Atlas](#codebase-atlas) above.

## Monorepo Features

- **Shared dependencies** - Common packages reused across apps
- **Incremental builds** - Only rebuild what changed
- **Parallel execution** - Run tasks across packages simultaneously
- **Type safety** - End-to-end TypeScript support
- **Code sharing** - Share schemas, types, and utilities

### Apps (`apps/`)

#### `nextjs`

Modern full-stack Next.js application — the only server. Server Components and route handlers talk to Postgres and S3 directly; there's no separate backend service.

**Features:**

- No authentication layer — no session, no protected routes
- S3 image proxying, served from a route handler
- Zod validation colocated per feature

**Tech:** Next.js 15, React 19, Tailwind CSS 4, shadcn/ui, React Hook Form, Zod, Zustand, Prisma, AWS SDK

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
turbo dev --filter=nextjs
```

### Build

Build all apps and packages:

```bash
bun run build
```

### Other scripts

Type checking, oxc formatting/linting, package-version syncing and update checks are all defined as scripts — see the root and per-package `package.json` for the full, authoritative list (e.g. `check-types`, `check-format`, `format`, `check-mismatches`, `sync-packages`).

## Environment Setup

See `apps/nextjs/.env.example` for the full list of required variables. Copy it to `.env` and fill in your credentials.

## Deployment

The app deploys to AWS on **Amplify Hosting**, which owns its own CDN, build,
and SSR compute in a single `prod` member account. Amplify's own GitHub build
webhook deploys the app directly on push — there is no blue/green canary and
**no automatic rollback**, so recovering from a bad release means redeploying
a previous build (the procedure is in the runbook). To bring up the environment from scratch —
prerequisites, GitHub variables/secrets, state-bucket bootstrap, and the first
apply — follow [**docs/runbook.md**](docs/runbook.md). The reference for how
the environment and pipeline work is
[docs/deployment-environments.md](docs/deployment-environments.md), with the
underlying AWS architecture in [docs/architecture.md](docs/architecture.md).

## AI-Driven Development

This template ships with a [Claude Code](https://claude.com/claude-code) harness
for building features spec-first with an AI agent (`brainstorm → /spec` → `/plan` → `/implement` → `/qa`). New here? Start with
[**docs/ai-driven-development.md**](docs/ai-driven-development.md).
