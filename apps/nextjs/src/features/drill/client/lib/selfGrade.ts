import ky from 'ky'

import { catchAsyncError } from '@/features/error/utils/catchError'

interface SelfGradeParams {
  runId: string
  questionId: string
  hadIt: boolean
}

export const selfGrade = ({ runId, questionId, hadIt }: SelfGradeParams) =>
  catchAsyncError(
    ky
      .post(`/api/drill/runs/${runId}/self-grade`, {
        json: { questionId, hadIt }
      })
      .json()
  ).map(() => undefined)
