import { type NextRequest, NextResponse } from 'next/server'

import { idSchema } from '@/features/drill/schemas/run.schema'
import { submitAnswerSchema } from '@/features/drill/schemas/submitAnswer.schema'
import { submitAnswer } from '@/features/drill/server/api'
import { AppError } from '@/features/error/lib/AppError'
import { catchAsyncError } from '@/features/error/utils/catchError'
import { withRequestLogging } from '@/lib/requestLogging'

type RunRouteContext = { params: Promise<{ runId: string }> }

export const POST = withRequestLogging<RunRouteContext>(
  async (request: NextRequest, { params }) => {
    const parsedRunId = idSchema.safeParse((await params).runId)
    if (!parsedRunId.success)
      throw new AppError('BAD_REQUEST', 'Invalid run id')

    const body = await catchAsyncError(request.json())
    if (body.isErr())
      throw new AppError('BAD_REQUEST', 'Invalid JSON in request body')

    const parsedBody = submitAnswerSchema.safeParse(body.value)
    if (!parsedBody.success)
      throw new AppError('BAD_REQUEST', 'Invalid answer payload')

    const result = await submitAnswer({
      runId: parsedRunId.data,
      ...parsedBody.data
    })
    if (result.isErr()) throw result.error

    return NextResponse.json(result.value)
  }
)
