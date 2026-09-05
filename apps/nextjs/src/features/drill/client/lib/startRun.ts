import ky from 'ky'

import { runCreatedSchema } from '@/features/drill/schemas/runCreated.schema'
import type { StartRunInput } from '@/features/drill/schemas/startRun.schema'
import { catchAsyncError } from '@/features/error/utils/catchError'
import { parseResponse } from '@/features/error/utils/parseResponse'

const parseRunCreated = parseResponse(
  runCreatedSchema,
  'Unexpected run response'
)

export const startRun = (input: StartRunInput) =>
  catchAsyncError(
    ky.post('/api/drill/runs', { json: input }).json<unknown>()
  ).andThen(parseRunCreated)

export const retryRun = (runId: string) =>
  catchAsyncError(
    ky.post(`/api/drill/runs/${runId}/retry`).json<unknown>()
  ).andThen(parseRunCreated)
