'use client'

import { useRef, useState } from 'react'

import type { ResultAsync } from 'neverthrow'
import { toast } from 'sonner'

import type { AnswerVerdict } from '@/features/drill/schemas/answerVerdict.schema'
import type { AppError } from '@/features/error/lib/AppError'

import { selfGrade } from '../lib/selfGrade'
import { submitAnswer } from '../lib/submitAnswer'

import type { QuestionState } from './useDrillAnswers'

export type FailedSubmit =
  | { kind: 'answer'; questionId: string; response: string | string[] }
  | { kind: 'self-grade'; questionId: string; hadIt: boolean }

interface UseDrillSubmissionsParams {
  runId: string
  patchQuestionState: (
    questionId: string,
    patch: Partial<QuestionState>
  ) => void
  verdictFor: (questionId: string) => AnswerVerdict | null
}

const usePendingRequest = () => {
  const [isPending, setIsPending] = useState(false)
  const isPendingRef = useRef(false)

  const run = <T>(
    start: () => ResultAsync<T, AppError>,
    onSuccess: (value: T) => void,
    onFailure: (error: AppError) => void
  ) => {
    if (isPendingRef.current) return
    isPendingRef.current = true
    setIsPending(true)

    start()
      .match(onSuccess, (error) => {
        onFailure(error)
        toast.error(error.message)
      })
      .finally(() => {
        isPendingRef.current = false
        setIsPending(false)
      })
  }

  return { isPending, run }
}

export const useDrillSubmissions = ({
  runId,
  patchQuestionState,
  verdictFor
}: UseDrillSubmissionsParams) => {
  const answer = usePendingRequest()
  const selfGrading = usePendingRequest()
  const [failedSubmit, setFailedSubmit] = useState<FailedSubmit | null>(null)

  const runSubmitAnswer = (questionId: string, response: string | string[]) => {
    answer.run(
      () => {
        setFailedSubmit(null)
        return submitAnswer({ runId, questionId, response })
      },
      (result) => patchQuestionState(questionId, { verdict: result }),
      () => setFailedSubmit({ kind: 'answer', questionId, response })
    )
  }

  const runSelfGrade = (questionId: string, hadIt: boolean) => {
    const capturedVerdict = verdictFor(questionId)
    selfGrading.run(
      () => {
        setFailedSubmit(null)
        return selfGrade({ runId, questionId, hadIt })
      },
      (gradedVerdict) => {
        patchQuestionState(questionId, {
          selfGradeOutcome: hadIt ? 'had-it' : 'missed-it',

          verdict: capturedVerdict
            ? { ...capturedVerdict, verdict: gradedVerdict }
            : capturedVerdict
        })
      },
      () => setFailedSubmit({ kind: 'self-grade', questionId, hadIt })
    )
  }

  const retryFailedSubmit = () => {
    if (!failedSubmit) return
    if (failedSubmit.kind === 'answer')
      runSubmitAnswer(failedSubmit.questionId, failedSubmit.response)
    else runSelfGrade(failedSubmit.questionId, failedSubmit.hadIt)
  }

  return {
    isSubmitting: answer.isPending,
    isSelfGradeSubmitting: selfGrading.isPending,
    failedSubmit,
    runSubmitAnswer,
    runSelfGrade,
    retryFailedSubmit
  }
}
