import { type NextRequest, NextResponse } from 'next/server'

import { selfGradeSchema } from '@/features/drill/schemas/selfGrade.schema'
import { selfGrade } from '@/features/drill/server/api'
import { parseJsonBody } from '@/lib/requestInput'
import { withRequestLogging } from '@/lib/requestLogging'

import { parseRunId, type RunRouteContext } from '../runRouteContext'

export const POST = withRequestLogging<RunRouteContext>(
  async (request: NextRequest, context) => {
    const [runId, input] = await Promise.all([
      parseRunId(context),
      parseJsonBody(request, selfGradeSchema, 'Invalid self-grade payload')
    ])
    return NextResponse.json(await selfGrade({ runId, ...input }))
  }
)
