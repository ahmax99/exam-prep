import ky from 'ky'
import { z } from 'zod'

import { catchAsyncError } from '@/features/error/utils/catchError'
import { parseResponse } from '@/features/error/utils/parseResponse'

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
  )
    .andThen(
      parseResponse(selfGradeResultSchema, 'Unexpected self-grade response')
    )
    .map(({ verdict }) => verdict)
