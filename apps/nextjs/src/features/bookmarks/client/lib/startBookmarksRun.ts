import ky from 'ky'
import { errAsync, okAsync } from 'neverthrow'
import { z } from 'zod'

import { AppError } from '@/features/error/lib/AppError'
import { catchAsyncError } from '@/features/error/utils/catchError'

const startRunResponseSchema = z.object({ id: z.string() })
type StartRunResponse = z.infer<typeof startRunResponseSchema>

export const startBookmarksRun = (certSlug: string) =>
  catchAsyncError(
    ky
      .post('/api/drill/runs', {
        json: { scopeKind: 'BOOKMARKS', scopeValue: '', certSlug }
      })
      .json<unknown>()
  ).andThen((body) => {
    const parsed = startRunResponseSchema.safeParse(body)
    return parsed.success
      ? okAsync<StartRunResponse, AppError>(parsed.data)
      : errAsync<StartRunResponse, AppError>(
          new AppError('INTERNAL_ERROR', 'Unexpected run response')
        )
  })
