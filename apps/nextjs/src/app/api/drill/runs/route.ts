import { type NextRequest, NextResponse } from 'next/server'

import { startRunSchema } from '@/features/drill/schemas/startRun.schema'
import { startRun } from '@/features/drill/server/api'
import { parseJsonBody } from '@/lib/requestInput'
import { withRequestLogging } from '@/lib/requestLogging'

export const POST = withRequestLogging(async (request: NextRequest) => {
  const input = await parseJsonBody(
    request,
    startRunSchema,
    'Invalid scope payload'
  )
  return NextResponse.json(await startRun(input), { status: 201 })
})
