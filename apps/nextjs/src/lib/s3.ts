import 'server-only'
import { S3Client } from '@aws-sdk/client-s3'
import { awsCredentialsProvider } from '@vercel/oidc-aws-credentials-provider'

import { env } from '@/config/env'

// On Vercel, use OIDC: the default chain would pick up Vercel's own AWS keys
export const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: env.AWS_ROLE_ARN
    ? awsCredentialsProvider({ roleArn: env.AWS_ROLE_ARN })
    : undefined
})
