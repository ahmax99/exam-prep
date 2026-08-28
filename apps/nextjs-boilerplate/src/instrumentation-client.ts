import * as Sentry from '@sentry/nextjs'

fetch('/api/config')
  .then((response) => response.json())
  .then(({ sentryDsn }: { sentryDsn: string }) => {
    if (!sentryDsn) return

    Sentry.init({
      dsn: sentryDsn,
      integrations: [Sentry.replayIntegration()],
      tracesSampleRate: process.env.NODE_ENV === 'development' ? 1 : 0.1,
      enableLogs: true,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1,
      sendDefaultPii: true
    })
  })
  .catch(() => {
    // Never let telemetry setup crash the app.
  })

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
