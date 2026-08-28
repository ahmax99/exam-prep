import { type NextRequest, NextResponse } from 'next/server'

import type { Logger } from 'pino'

import { logger } from '@/config/logger'
import { catchAsyncError } from '@/features/error/utils/catchError'

const log = logger.child({ module: 'api' })

type RouteHandler<Context> = (
  request: NextRequest,
  context: Context
) => Promise<NextResponse>

export const withRequestLogging =
  <Context = unknown>(handler: RouteHandler<Context>): RouteHandler<Context> =>
  async (request, context) => {
    const { method } = request
    const { pathname } = request.nextUrl
    const start = performance.now()

    const result = await catchAsyncError(handler(request, context))

    return result.match(
      (response) => {
        log.info(
          {
            req: { method, url: pathname },
            res: { status: response.status },
            durationMs: Math.round(performance.now() - start)
          },
          'Request completed'
        )

        return response
      },
      (error) => {
        log.error(
          {
            req: { method, url: pathname },
            res: { status: error.status },
            durationMs: Math.round(performance.now() - start),
            error
          },
          'Request failed'
        )

        return NextResponse.json(
          { error: { message: error.message } },
          { status: error.status }
        )
      }
    )
  }

export const logBeforeRequest =
  (clientLog: Logger) =>
  ({ request }: { request: Request }) =>
    clientLog.info(
      { req: { method: request.method, url: request.url } },
      'Calling backend'
    )

export const logAfterResponse =
  (clientLog: Logger) =>
  ({ request, response }: { request: Request; response: Response }) =>
    clientLog.info(
      {
        req: { method: request.method, url: request.url },
        res: { status: response.status }
      },
      'Backend responded'
    )
