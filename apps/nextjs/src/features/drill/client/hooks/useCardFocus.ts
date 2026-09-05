'use client'

import { useEffect, type RefObject } from 'react'

import type { AnswerVerdict } from '@/features/drill/schemas/answerVerdict.schema'
import type { QuestionType } from '@/lib/prisma'

import type { SelfGradeOutcome } from './useDrillAnswers'

interface UseCardFocusParams {
  containerRef: RefObject<HTMLElement | null>
  question: { type: QuestionType } | undefined
  verdict: AnswerVerdict | null
  selfGradeOutcome: SelfGradeOutcome | null
}

export const useCardFocus = ({
  containerRef,
  question,
  verdict,
  selfGradeOutcome
}: UseCardFocusParams) => {
  useEffect(() => {
    if (question?.type === 'FILL_IN' && verdict === null) return

    containerRef.current?.focus({ preventScroll: true })
  }, [containerRef, verdict, selfGradeOutcome, question])
}
