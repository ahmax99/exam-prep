import { type NextRequest, NextResponse } from 'next/server'

import { retryRun } from '@/features/drill/server/api'
import { withRequestLogging } from '@/lib/requestLogging'

import { parseRunId, type RunRouteContext } from '../runRouteContext'

export const POST = withRequestLogging<RunRouteContext>(
  async (_request: NextRequest, context) =>
    NextResponse.json(await retryRun(await parseRunId(context)), {
      status: 201
    })
)
