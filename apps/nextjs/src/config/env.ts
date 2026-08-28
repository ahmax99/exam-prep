import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    AWS_REGION: z.string().min(1).default('ap-northeast-1'),
    BASE_URL: z.url().default('http://localhost:3000'),
    DATABASE_URL: z.url().optional(),
    DATABASE_URL_SECRET_NAME: z.string().min(1).optional(),
    NODE_ENV: z.enum(['development', 'production']).default('production'),
    S3_BUCKET_NAME: z.string().min(1)
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true
})
