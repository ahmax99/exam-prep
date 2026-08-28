import 'server-only'
import { connection } from 'next/server'

import { AwsClient } from 'aws4fetch'

import { env } from '@/config/env'

export const signingHook = async ({ request }: { request: Request }) => {
  if (env.NODE_ENV !== 'production') return
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY)
    return

  await connection()

  // Construct the client per-call: Lambda rotates AWS_SESSION_TOKEN, so caching a client across invocations would carry stale credentials.
  const aws = new AwsClient({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    service: 'lambda',
    region: env.AWS_REGION
  })

  return aws.sign(request)
}
