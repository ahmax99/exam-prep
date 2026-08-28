import * as Sentry from '@sentry/bun'

export const captureError = (error: Error) => Sentry.captureException(error)
