import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    AWS_REGION: z.string().min(1).default('ap-northeast-1'),
    AWS_ROLE_ARN: z
      .string()
      .regex(/^arn:aws:iam::\d{12}:role\/.+$/)
      .optional(),
    DATABASE_URL: z.url(),
    NODE_ENV: z.enum(['development', 'production']).default('production'),
    S3_BUCKET_NAME: z.string().min(1)
  },
  runtimeEnv: {
    AWS_REGION: process.env.AWS_REGION,
    AWS_ROLE_ARN: process.env.AWS_ROLE_ARN,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true
})
