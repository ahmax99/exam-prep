import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    AWS_REGION: z.string().min(1),
    BACKEND_PORT: z.string().min(1),
    COGNITO_USERPOOL_ID: z.string().min(1),
    COGNITO_CLIENT_ID: z.string().min(1),
    FRONTEND_URL: z.url(),
    NODE_ENV: z.enum(['development', 'production']),
    S3_BUCKET_NAME: z.string().min(1),
    SENTRY_DSN: z.url()
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true
})
