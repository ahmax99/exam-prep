import { type NextRequest, NextResponse } from 'next/server'

import { submitAnswerSchema } from '@/features/drill/schemas/submitAnswer.schema'
import { submitAnswer } from '@/features/drill/server/api'
import { parseJsonBody } from '@/lib/requestInput'
import { withRequestLogging } from '@/lib/requestLogging'

import { parseRunId, type RunRouteContext } from '../runRouteContext'

export const POST = withRequestLogging<RunRouteContext>(
  async (request: NextRequest, context) => {
    const [runId, input] = await Promise.all([
      parseRunId(context),
      parseJsonBody(request, submitAnswerSchema, 'Invalid answer payload')
    ])
    return NextResponse.json(await submitAnswer({ runId, ...input }))
  }
)
