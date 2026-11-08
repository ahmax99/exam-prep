import type { Instrumentation } from 'next'

// The one place server render and route errors are logged.
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context
) => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const { logger } = await import('@/config/logger')
  logger.error(
    {
      error,
      req: { method: request.method, url: request.path },
      route: context.routePath,
      routeType: context.routeType
    },
    'Request failed'
  )
}
