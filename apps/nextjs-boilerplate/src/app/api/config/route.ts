import { connection, NextResponse } from 'next/server'

import { env } from '@/config/env'
import { withRequestLogging } from '@/lib/requestLogging'

export const GET = withRequestLogging(async () => {
  await connection()

  return NextResponse.json({ sentryDsn: env.SENTRY_DSN ?? '' })
})
