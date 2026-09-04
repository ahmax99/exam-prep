# Exam Prep — Next.js app

The only server in this repo. Server Components and route handlers reach Postgres (via Prisma)
and S3 (via the AWS SDK) directly — there is no separate backend service to forward to.

## Setup

1. Copy `.env.example` to `.env` in this directory.

2. Fill it in:

```env
# Database (Neon PostgreSQL) — required locally
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Object storage for question images — required
S3_BUCKET_NAME=""

# Optional; shown with their defaults
AWS_REGION="ap-northeast-1"
BASE_URL="http://localhost:3000"
```

`DATABASE_URL_SECRET_NAME` replaces `DATABASE_URL` in deployed environments, where the
connection string is resolved from AWS Secrets Manager at runtime instead of the environment.

> **Build once, run anywhere.** Every variable here is **server-only**, read from
> `process.env` at runtime. There is deliberately no `NEXT_PUBLIC_*` variable in this app —
> Next.js inlines those into the JS bundle at build time, which would permanently bake one
> environment's values into that build. Client code that needs to reach this app uses
> same-origin relative paths (`/api/...`), never an absolute base URL from env.

3. Set up the database:

```bash
bun run db:generate   # prisma generate (also runs automatically as prebuild)
bun run db:migrate    # prisma migrate dev
bun run db:seed       # load question banks from the repo-root data/ directory
```

`db:seed` reads JSON banks from the repo-root `data/` directory, which is git-ignored — the
question content is not committed, so a fresh clone starts with an empty catalog until you
supply banks. Every file is validated against a schema before a row is written.

## Development

```bash
bun run dev           # http://localhost:3000 (Turbopack)
bun run build         # production build
bun run start         # serve the production build
bun run check-types   # tsc --noEmit
bun run doctor        # react-doctor health scan
```

Linting and formatting run from the repo root (`bun run check-format`), not here — oxlint and
oxfmt are configured once for the whole workspace.

Other database scripts: `db:deploy` (apply migrations without prompting), `db:push`,
`db:pull`, `db:reset`.

## Project Structure

```
prisma/
├── schema.prisma     # 8 models, 3 enums
├── migrations/
└── seed.ts           # validates and loads question banks

src/
├── app/              # App Router
│   ├── (public)/     # normal shell: dashboard, certification, runs, bookmarks, summary
│   ├── (drill)/      # no shell — the drill screen owns the viewport
│   └── api/          # 8 thin route handlers
├── components/       # atoms → molecules → organisms, plus layout
├── features/         # drill, progress, catalog, bookmarks, media, error, metadata, theme
├── config/           # validated env, logger
├── lib/              # prisma client, s3 client, request logging
├── styles/           # design tokens (CSS custom properties → Tailwind)
└── utils/
```

Each feature is split by execution context: `server/` (Server Components and route-handler
logic), `client/` (`'use client'` components and callers), and `schemas/` (Zod). Feature-owned
UI stays in the feature; only cross-feature UI belongs in `src/components/`.

## Design system

`DESIGN.md` and `PRODUCT.md` in this directory are the design-system and product-context
records used by the `impeccable` skill, with the machine-readable sidecar in
`.impeccable/design.json`. Read `DESIGN.md` before changing tokens or adding a component
variant — it carries the named rules the UI is held to.
