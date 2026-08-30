import ky from 'ky'
import { errAsync, okAsync } from 'neverthrow'

import {
  type AnswerVerdict,
  answerVerdictSchema
} from '@/features/drill/schemas/answerVerdict.schema'
import { AppError } from '@/features/error/lib/AppError'
import { catchAsyncError } from '@/features/error/utils/catchError'

interface SubmitAnswerParams {
  runId: string
  questionId: string
  response: string | string[]
}

export const submitAnswer = ({
  runId,
  questionId,
  response
}: SubmitAnswerParams) =>
  catchAsyncError(
    ky
      .post(`/api/drill/runs/${runId}/answers`, {
        json: { questionId, response }
      })
      .json<unknown>()
  ).andThen((body) => {
    const parsed = answerVerdictSchema.safeParse(body)
    return parsed.success
      ? okAsync<AnswerVerdict, AppError>(parsed.data)
      : errAsync<AnswerVerdict, AppError>(
          new AppError('INTERNAL_ERROR', 'Unexpected answer response')
        )
  })
