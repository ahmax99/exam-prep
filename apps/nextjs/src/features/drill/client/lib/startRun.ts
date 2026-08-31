import ky from 'ky'
import { errAsync, okAsync } from 'neverthrow'

import {
  type RunCreated,
  runCreatedSchema
} from '@/features/drill/schemas/runCreated.schema'
import type { StartRunInput } from '@/features/drill/schemas/startRun.schema'
import { AppError } from '@/features/error/lib/AppError'
import { catchAsyncError } from '@/features/error/utils/catchError'

const parseRunCreated = (body: unknown) => {
  const parsed = runCreatedSchema.safeParse(body)
  return parsed.success
    ? okAsync<RunCreated, AppError>(parsed.data)
    : errAsync<RunCreated, AppError>(
        new AppError('INTERNAL_ERROR', 'Unexpected run response')
      )
}

export const startRun = (input: StartRunInput) =>
  catchAsyncError(
    ky.post('/api/drill/runs', { json: input }).json<unknown>()
  ).andThen(parseRunCreated)

export const retryRun = (runId: string) =>
  catchAsyncError(
    ky.post(`/api/drill/runs/${runId}/retry`).json<unknown>()
  ).andThen(parseRunCreated)
