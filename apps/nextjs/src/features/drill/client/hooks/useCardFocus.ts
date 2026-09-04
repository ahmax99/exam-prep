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

/**
 * Keeps keyboard control anchored in the drill card so useDrillKeys'
 * focus-containment gate doesn't silently swallow every shortcut.
 *
 * Mount, a Submit -> Next / Y-N -> outcome transition (both unmount the
 * previously focused button, which drops document.activeElement to <body>), and
 * FillInField's own blur-on-answer (a child effect, so it always runs before
 * this one and gets overridden here) all need focus restored to the container.
 *
 * The one exception is an unanswered FILL_IN question: its own autoFocus (set
 * during React's commit phase, before this passive effect runs) owns focus
 * while verdict is still null, and stealing it here would fight that — but once
 * verdict is set the input goes read-only and blurs itself, so the card needs
 * focus back regardless of question type.
 */
export const useCardFocus = ({
  containerRef,
  question,
  verdict,
  selfGradeOutcome
}: UseCardFocusParams) => {
  useEffect(() => {
    if (question?.type === 'FILL_IN' && verdict === null) return
    // preventScroll: this fires after every transition, and a long question on
    // mobile can have its Submit/self-grade button below the fold — a bare
    // .focus() would jump the viewport back to the top of the card.
    containerRef.current?.focus({ preventScroll: true })
    // containerRef only satisfies exhaustive-deps now that the ref arrives as a
    // parameter; a ref object is stable, so it never re-runs the effect.
  }, [containerRef, verdict, selfGradeOutcome, question])
}
