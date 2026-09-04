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

/**
 * The two writes a drill card makes — submitting an answer and self-grading a
 * no-match — as one in-flight-guarded pair, with the last failure kept so the
 * card can offer a retry that repeats exactly the request that failed.
 *
 * Neither call touches navigation: on success it patches the question's state
 * and nothing else, so the caller stays in charge of when the run advances.
 */
export const useDrillSubmissions = ({
  runId,
  patchQuestionState,
  verdictFor
}: UseDrillSubmissionsParams) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSelfGradeSubmitting, setIsSelfGradeSubmitting] = useState(false)
  const [failedSubmit, setFailedSubmit] = useState<FailedSubmit | null>(null)
  // Plain refs, not the state above: two keydown events arriving before React
  // flushes a state update must still see the in-flight request.
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
    // Captured now, not read fresh at resolve time — the async gap must not let
    // a navigation-driven state change land on the wrong verdict object.
    const capturedVerdict = verdictFor(questionId)
    selfGrade({ runId, questionId, hadIt })
      .match(
        (gradedVerdict) => {
          patchQuestionState(questionId, {
            selfGradeOutcome: hadIt ? 'had-it' : 'missed-it',
            // Flips FillInField from the frozen no-match/amber treatment to the
            // graded matched/wrong one — the reveal fields are unchanged from
            // the original no-match response, only the discriminant moves.
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
