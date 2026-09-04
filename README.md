# Exam Prep

A spaced-recall drill tool for certification exam preparation, built as a Turborepo monorepo
on Bun with a single Next.js application.

Pick a scope — a whole exam, one objective, the questions you've missed, or ones you've never
seen — work through the queue, get judged immediately, and watch the mastery of each
individual question move as a result. A large share of the bank is fill-in rather than
multiple choice: you type the answer from memory, and when the grader can't decide whether
what you typed counts, it says so and asks you to self-grade rather than guessing on your
behalf.

Mastery is tracked **per exam objective**, not per deck or per exam, which is what makes
"drill my weak spots" a real button. Two consecutive correct answers promote a question; one
wrong answer sends it back. Nothing resets between sessions.

> **Single-user by design.** There is no sign-in, no accounts and no authorization layer
> anywhere in this app. That's a deliberate non-goal, not missing scope — see
> `apps/nextjs/PRODUCT.md`.

## Tech Stack

### Package Manager & Build Tools

- **[Bun](https://bun.sh/)** - Package manager and build/script runner (not the server runtime)
- **[Node.js](https://nodejs.org/)** - The runtime the app actually runs on, locally and on Amplify's SSR compute
- **[Turborepo](https://turbo.build/repo)** - High-performance build system for monorepos
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript

### App

- **[Next.js](https://nextjs.org/)** 15 - React framework with App Router (Turbopack, React Compiler)
- **[React](https://react.dev/)** 19 - UI library with Server Components
- **[Tailwind CSS](https://tailwindcss.com/)** 4 - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** + **[Base UI](https://base-ui.com/)** - Component primitives
- **[Zod](https://zod.dev/)** - Schema validation at every boundary
- **[neverthrow](https://github.com/supermacro/neverthrow)** - `Result` types, so failures are values rather than thrown exceptions
- **[Zustand](https://zustand-demo.pmnd.rs/)** - Client state (error surfacing)
- **[pino](https://getpino.io/)** - Structured logging

### Database & Storage

- **[Neon](https://neon.tech/)** - Serverless PostgreSQL
- **[Prisma](https://www.prisma.io/)** 7 - Type-safe ORM with the Neon serverless adapter
- **[AWS S3](https://aws.amazon.com/s3/)** - Object storage for question images (read-only; nothing uploads)

### Code Quality

- **[oxc](https://oxc.rs/)** (oxlint + oxfmt) - Fast linter and formatter
- **[Lefthook](https://lefthook.dev/)** - Git hooks (pre-commit runs oxfmt/oxlint on staged files, `terraform fmt`, and `gitleaks`)
- **[gitleaks](https://github.com/gitleaks/gitleaks)** - Secret scanning, locally and in CI
- **[react-doctor](https://github.com/millionco/react-doctor)** - React security/performance/a11y scanner; new errors fail a PR
- **[fallow](https://docs.fallow.tools/)** - Static analysis for unused code, duplication, complexity, and architecture drift
- **[SonarQube](https://docs.sonarsource.com)** - Continuous inspection for bugs, vulnerabilities, and code smells

> **No test runner.** There is no unit-test framework and no test file in this repo.
> Verification comes from type-checking, linting, the CI scanners above, and browser-level
> checks via Playwright.

## Getting Started

### Prerequisites

- **Bun** >= 1.3.11
- **Node.js** >= 24

This repo also uses [graphify](https://github.com/safishamsi/graphify) to maintain a
persistent codebase knowledge graph for AI-assisted development.

**One-time setup** (requires Python 3.10+ and [`uv`](https://docs.astral.sh/uv/getting-started/installation/)):

```bash
bun run graphify:install   # install graphify via uv
bun run graphify:build     # generate graphify-out/ (uses graphify update — no API key needed)
```

After this, the graph rebuilds automatically after every commit via a Lefthook post-commit
hook. `graphify-out/` is gitignored, so run `bun run graphify:build` once after cloning.

> If `bun run graphify:build` prompts for an API key or errors on Markdown files, add `docs/`
> to `.graphifyignore` and re-run.

### Installation

```bash
bun install
```

### Environment

Copy `apps/nextjs/.env.example` to `apps/nextjs/.env` and fill it in:

| Variable                   | Required | Notes                                                                          |
| -------------------------- | -------- | ------------------------------------------------------------------------------ |
| `DATABASE_URL`             | locally  | Neon connection string. Deployed environments resolve it from a secret instead |
| `DATABASE_URL_SECRET_NAME` | deployed | Secrets Manager secret holding the connection string                           |
| `S3_BUCKET_NAME`           | yes      | Bucket holding question images                                                 |
| `AWS_REGION`               | no       | Defaults to `ap-northeast-1`                                                   |
| `BASE_URL`                 | no       | Defaults to `http://localhost:3000`                                            |

Every variable is **server-only** — there is deliberately no `NEXT_PUBLIC_*` variable
anywhere, so one build can run in any environment rather than baking one environment's values
into the bundle.

### Database and question banks

```bash
turbo db:generate --filter=nextjs        # prisma generate (also runs as the app's prebuild)
cd apps/nextjs && bun run db:migrate     # prisma migrate dev
cd apps/nextjs && bun run db:seed        # load the question banks
```

`db:seed` reads JSON banks from the repo-root **`data/`** directory, which is **git-ignored** —
the question content is not committed. With no `data/` present the seed has nothing to load,
so a fresh clone comes up with an empty catalog until you supply banks. Each file is validated
against a schema before a single row is written, so a malformed bank fails loudly instead of
landing half-loaded.

### Development

```bash
turbo dev --filter=nextjs    # http://localhost:3000
bun run build                # build all apps
bun run check-types          # tsc --noEmit
bun run check-format         # oxlint + oxfmt --check
```

Package-version syncing, update checks and the rest are defined as scripts — see the root and
per-package `package.json` for the authoritative list.

## Codebase Atlas

An isometric map of the whole repo: each subsystem is a city block sized by its measured line
count, wired together by the calls and data that actually flow between them. Click any block
for what it does and how it's built, go inside the big ones for their breakdown, or play one
of the four end-to-end traces.

It is a single self-contained file, so open
[`docs/atlas/atlas.html`](docs/atlas/atlas.html) straight in a browser, or serve it with:

```bash
bun run atlas    # http://localhost:8731/atlas.html
```

Every number on the page is measured from the working tree, not estimated. See
[docs/atlas/README.md](docs/atlas/README.md) for how it was measured and how to refresh it as
the code changes.

## Workspace Structure

Workspaces are `apps/*`, and there is exactly one: `apps/nextjs`.

### `apps/nextjs`

The Next.js app is the **only server**. Server Components and route handlers do their own data
access directly — Postgres via Prisma, S3 via the AWS SDK — so there is no separate backend
service to forward to, and browser code never holds a credential for either.

Eight feature modules live under `src/features/<name>/`, split by execution context
(`server/`, `client/`, `schemas/`): **drill** (the queue, the grader, the mastery transition —
by far the largest), **progress**, **catalog**, **bookmarks**, **media**, **error**,
**metadata** and **theme**. Shared UI is atomic-design layered under `src/components/`.

> This is a high-level summary. The internal architecture — module layout, the neverthrow
> error pipeline, server-only data access, rendering rules — is documented for contributors in
> `.claude/rules/architecture.md` and `.claude/rules/conventions.md`. For a visual overview,
> see the [Codebase Atlas](#codebase-atlas) above.

## Deployment

The app deploys to AWS on **Amplify Hosting**, which owns its own CDN, build, and SSR compute
in a single `prod` member account. Amplify's own GitHub build webhook deploys the app directly
on push — there is no blue/green canary and **no automatic rollback**, so recovering from a bad
release means redeploying a previous build (the procedure is in the runbook).

To bring up the environment from scratch — prerequisites, GitHub variables/secrets,
state-bucket bootstrap, and the first apply — follow [**docs/runbook.md**](docs/runbook.md).
The reference for how the environment and pipeline work is
[docs/deployment-environments.md](docs/deployment-environments.md), with the underlying AWS
architecture in [docs/architecture.md](docs/architecture.md) and the current repo settings in
[docs/github-repo-settings.md](docs/github-repo-settings.md).

## AI-Driven Development

This repo ships a [Claude Code](https://claude.com/claude-code) harness for building features
spec-first with an AI agent (`brainstorm → /spec` → `/plan` → `/implement` → `/qa`). New here?
Start with [**docs/ai-driven-development.md**](docs/ai-driven-development.md).
