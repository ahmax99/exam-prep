import { type NextRequest, NextResponse } from 'next/server'

import { deleteRun } from '@/features/drill/server/api'
import { withRequestLogging } from '@/lib/requestLogging'

import { parseRunId, type RunRouteContext } from './runRouteContext'

export const DELETE = withRequestLogging<RunRouteContext>(
  async (_request: NextRequest, context) => {
    await deleteRun(await parseRunId(context))
    return new NextResponse(null, { status: 204 })
  }
)
