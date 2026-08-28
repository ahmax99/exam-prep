import * as Sentry from '@sentry/nextjs'

import { env } from '@/config/env'

Sentry.init({
  dsn: env.SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 1,
  enableLogs: true,
  sendDefaultPii: true
})
