import * as Sentry from '@sentry/bun'

import { env } from './src/config/env.js'

Sentry.init({
  dsn: env.SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 1,
  enableLogs: true,
  sendDefaultPii: true
})
