# Backend Boilerplate API

RESTful API built with Elysia and Bun runtime for managing posts and comments.

## Setup

1. Copy the environment file:

```bash
cp .env.example .env
```

2. Configure environment variables in `.env`:

```env
# AWS Configuration
AWS_REGION="us-east-1"
S3_BUCKET_NAME="your-bucket-name"

# Application
NODE_ENV="development"

# Database (Local Development Only - Lambda uses Secrets Manager)
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Monitoring
SENTRY_DSN="your-sentry-dsn"
```

## Development

Start the development server:

```bash
bun run dev
```

The server runs at `http://localhost:4000`

## API Documentation

Interactive API documentation is available via Swagger UI:

**Swagger UI**: `http://localhost:4000/api/v1/openapi`

The documentation provides:

- Complete endpoint reference with request/response schemas
- Interactive API testing interface
- Authentication requirements for each endpoint
- Request parameter validation rules

### Available Endpoints

#### Posts

- `GET /api/v1/posts` - Get all posts
- `GET /api/v1/posts/:id` - Get post by ID
- `POST /api/v1/posts` - Create a new post (requires auth)
- `PUT /api/v1/posts/:id` - Update a post (requires auth)
- `DELETE /api/v1/posts/:id` - Delete a post (requires auth)
- `GET /api/v1/posts/presigned-url` - Get S3 presigned URL for image upload (requires auth)

#### Comments

- `GET /api/v1/comments?postId={uuid}` - Get comments for a post
- `POST /api/v1/comments` - Create a new comment (requires auth)
- `DELETE /api/v1/comments/:id` - Delete a comment (requires auth)
