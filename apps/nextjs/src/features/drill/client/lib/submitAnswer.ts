import ky from 'ky'

import { answerVerdictSchema } from '@/features/drill/schemas/answerVerdict.schema'
import { catchAsyncError } from '@/features/error/utils/catchError'
import { parseResponse } from '@/features/error/utils/parseResponse'

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
  ).andThen(parseResponse(answerVerdictSchema, 'Unexpected answer response'))
