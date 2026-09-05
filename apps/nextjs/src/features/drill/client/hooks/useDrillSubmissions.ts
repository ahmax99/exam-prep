'use client'

import { useRef, useState } from 'react'

import { toast } from 'sonner'

import type { AnswerVerdict } from '@/features/drill/schemas/answerVerdict.schema'

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

export const useDrillSubmissions = ({
  runId,
  patchQuestionState,
  verdictFor
}: UseDrillSubmissionsParams) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSelfGradeSubmitting, setIsSelfGradeSubmitting] = useState(false)
  const [failedSubmit, setFailedSubmit] = useState<FailedSubmit | null>(null)

  const isSubmittingRef = useRef(false)
  const isSelfGradeSubmittingRef = useRef(false)

  const runSubmitAnswer = (questionId: string, response: string | string[]) => {
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    setIsSubmitting(true)
    setFailedSubmit(null)
    submitAnswer({ runId, questionId, response })
      .match(
        (result) => patchQuestionState(questionId, { verdict: result }),
        (error) => {
          setFailedSubmit({ kind: 'answer', questionId, response })
          toast.error(error.message)
        }
      )
      .finally(() => {
        isSubmittingRef.current = false
        setIsSubmitting(false)
      })
  }

  const runSelfGrade = (questionId: string, hadIt: boolean) => {
    if (isSelfGradeSubmittingRef.current) return
    isSelfGradeSubmittingRef.current = true
    setIsSelfGradeSubmitting(true)
    setFailedSubmit(null)

    const capturedVerdict = verdictFor(questionId)
    selfGrade({ runId, questionId, hadIt })
      .match(
        (gradedVerdict) => {
          patchQuestionState(questionId, {
            selfGradeOutcome: hadIt ? 'had-it' : 'missed-it',

            verdict: capturedVerdict
              ? { ...capturedVerdict, verdict: gradedVerdict }
              : capturedVerdict
          })
        },
        (error) => {
          setFailedSubmit({ kind: 'self-grade', questionId, hadIt })
          toast.error(error.message)
        }
      )
      .finally(() => {
        isSelfGradeSubmittingRef.current = false
        setIsSelfGradeSubmitting(false)
      })
  }

  const retryFailedSubmit = () => {
    if (!failedSubmit) return
    if (failedSubmit.kind === 'answer')
      runSubmitAnswer(failedSubmit.questionId, failedSubmit.response)
    else runSelfGrade(failedSubmit.questionId, failedSubmit.hadIt)
  }

  return {
    isSubmitting,
    isSelfGradeSubmitting,
    failedSubmit,
    runSubmitAnswer,
    runSelfGrade,
    retryFailedSubmit
  }
}
