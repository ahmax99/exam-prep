# Next.js Boilerplate

Modern full-stack Next.js application with authentication, authorization, and file uploads.

## Setup

1. Copy the environment file:

```bash
cp .env.example .env
```

2. Configure environment variables in `.env`:

```env
# AWS Configuration
AWS_REGION="us-east-1"

# Email
RESEND_API_KEY="your-resend-api-key"
FROM_EMAIL="noreply@yourdomain.com"
CONTACT_TO_EMAIL="contact@yourdomain.com"

# Application
BASE_URL="http://localhost:3000"

# Monitoring
SENTRY_DSN="your-sentry-dsn"
```

> **Build once, deploy many.** These are plain runtime environment variables, not `NEXT_PUBLIC_*` — they're read from `process.env` when the container starts, never baked into the JS bundle at build time. The same built Docker image can be promoted from dev to prod unchanged; only the container's runtime env differs between environments.

## Development

Start the development server:

```bash
bun run dev
```

The application runs at `http://localhost:3000`

Build for production:

```bash
bun run build
```

Start production server:

```bash
bun run start
```

Type checking:

```bash
bun run check-types
```

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # Reusable UI components
├── features/         # Feature-specific modules
├── hooks/           # Custom React hooks
├── lib/             # Utility libraries and configurations
├── styles/          # Global styles and Tailwind config
└── utils/           # Helper functions
```
