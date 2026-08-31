import { type NextRequest, NextResponse } from 'next/server'

import { idSchema } from '@/features/drill/schemas/run.schema'
import { retryRun } from '@/features/drill/server/api'
import { AppError } from '@/features/error/lib/AppError'
import { withRequestLogging } from '@/lib/requestLogging'

type RunRouteContext = { params: Promise<{ runId: string }> }

export const POST = withRequestLogging<RunRouteContext>(
  async (_request: NextRequest, { params }) => {
    const parsedRunId = idSchema.safeParse((await params).runId)
    if (!parsedRunId.success)
      throw new AppError('BAD_REQUEST', 'Invalid run id')

    const result = await retryRun(parsedRunId.data)
    if (result.isErr()) throw result.error

    return NextResponse.json(result.value, { status: 201 })
  }
)
