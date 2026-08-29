import { type NextRequest, NextResponse } from 'next/server'

import { startRunSchema } from '@/features/drill/schemas/startRun.schema'
import { startRun } from '@/features/drill/server/api'
import { AppError } from '@/features/error/lib/AppError'
import { catchAsyncError } from '@/features/error/utils/catchError'
import { withRequestLogging } from '@/lib/requestLogging'

export const POST = withRequestLogging(async (request: NextRequest) => {
  const body = await catchAsyncError(request.json())
  if (body.isErr())
    throw new AppError('BAD_REQUEST', 'Invalid JSON in request body')

  const parsedBody = startRunSchema.safeParse(body.value)
  if (!parsedBody.success)
    throw new AppError('BAD_REQUEST', 'Invalid scope payload')

  const result = await startRun(parsedBody.data)
  if (result.isErr()) throw result.error

  return NextResponse.json(result.value, { status: 201 })
})
