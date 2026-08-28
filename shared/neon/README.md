# @shared/neon

Prisma client configured for Neon serverless PostgreSQL database with connection pooling and WebSocket support.

## Setup

1. Copy the environment file:

```bash
cp .env.example .env
```

2. Add your Neon database URL to `.env`:

```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
```

## Database Commands

Generate Prisma client:

```bash
bun run db:generate
```

Push schema changes to database:

```bash
bun run db:push
```

Pull schema from database:

```bash
bun run db:pull
```

Deploy migrations:

```bash
bun run db:deploy
```

Reset database (⚠️ development only):

```bash
bun run db:reset
```

Seed database:

```bash
bun run db:seed
```

Migrate database in development:

```bash
# Create and apply migration
bun --bun prisma migrate dev --name descriptive_name

# Example
bun --bun prisma migrate dev --name add_user_profile
```

## Usage

Import the Prisma client in your application:

```typescript
import { prisma } from '@shared/neon'

// Query posts
const posts = await prisma.post.findMany()

// Create a post
const post = await prisma.post.create({
  data: {
    title: 'Hello World',
    content: 'My first post',
    authorId: 'user-id',
    slug: 'hello-world'
  }
})
```

## Development

Build the package:

```bash
bun run build
```

Watch mode for development:

```bash
bun run dev
```

Type checking:

```bash
bun run check-types
```
