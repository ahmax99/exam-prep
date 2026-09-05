import ky from 'ky'
import { errAsync, okAsync } from 'neverthrow'
import { z } from 'zod'

import { AppError } from '@/features/error/lib/AppError'
import { catchAsyncError } from '@/features/error/utils/catchError'

interface SelfGradeParams {
  runId: string
  questionId: string
  hadIt: boolean
}

const selfGradeResultSchema = z.object({
  verdict: z.enum(['matched', 'wrong'])
})

export const selfGrade = ({ runId, questionId, hadIt }: SelfGradeParams) =>
  catchAsyncError(
    ky
      .post(`/api/drill/runs/${runId}/self-grade`, {
        json: { questionId, hadIt }
      })
      .json<unknown>()
  ).andThen((body) => {
    const parsed = selfGradeResultSchema.safeParse(body)
    return parsed.success
      ? okAsync<'matched' | 'wrong', AppError>(parsed.data.verdict)
      : errAsync<'matched' | 'wrong', AppError>(
          new AppError('INTERNAL_ERROR', 'Unexpected self-grade response')
        )
  })
