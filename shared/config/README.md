# @shared/config

Shared configuration package containing Zod schemas, type definitions, and error constants used across the monorepo.

## What's Inside

### Schemas

- **Post Model** - Validation schemas for post creation, updates, and image uploads
- **Comment Model** - Validation schemas for comment creation
- **Email Schema** - Email validation utilities

### Error Definitions

Standardized error codes and messages:

- `NOT_FOUND` - Resource not found (404)
- `UNAUTHORIZED` - Authentication required (401)
- `FORBIDDEN` - Permission denied (403)
- `BAD_REQUEST` - Invalid request (400)
- `RATE_LIMIT_EXCEEDED` - Too many requests (429)
- `INVALID_EMAIL` / `DISPOSABLE_EMAIL` - Email validation errors (400)
- `INTERNAL_ERROR` - Server error (500)

## Usage

Import schemas and error definitions in your application:

```typescript
import { PostModel, CommentModel, ERROR_DEFINITIONS } from '@shared/config'

// Validate post creation
const result = PostModel.createBody.parse({
  title: 'My Post',
  content: 'Post content',
  authorId: 'uuid-here',
  slug: 'my-post'
})

// Use error definitions
throw new Error(ERROR_DEFINITIONS.UNAUTHORIZED.message)
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
