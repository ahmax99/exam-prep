import * as Sentry from '@sentry/nextjs'

import { logger } from './config/logger'
import { AppError } from './features/error/lib/AppError'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./features/error-tracking/config/sentry.server.config')

    logger.info('Server logger initialised')
  }

  if (process.env.NEXT_RUNTIME === 'edge')
    await import('./features/error-tracking/config/sentry.edge.config')
}

// An AppError is already reported to Sentry at its origin (catchAsyncError → captureError), so skip it here to avoid double-reporting.
export const onRequestError: typeof Sentry.captureRequestError = (
  error,
  request,
  errorContext
) => {
  if (error instanceof AppError) return

  Sentry.captureRequestError(error, request, errorContext)
}
