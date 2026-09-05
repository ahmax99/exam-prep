'use client'

import { useState } from 'react'

import type { AnswerVerdict } from '@/features/drill/schemas/answerVerdict.schema'

export type SelfGradeOutcome = 'had-it' | 'missed-it'

export interface QuestionState {
  selectedLetters: string[]
  fillInValue: string
  verdict: AnswerVerdict | null
  selfGradeOutcome: SelfGradeOutcome | null
}

const EMPTY_QUESTION_STATE: QuestionState = {
  selectedLetters: [],
  fillInValue: '',
  verdict: null,
  selfGradeOutcome: null
}

export const useDrillAnswers = (answeredQuestionIds: string[]) => {
  const [stateById, setStateById] = useState<Record<string, QuestionState>>({})

  const answeredBeforeMount = new Set(answeredQuestionIds)

  const patchQuestionState = (
    questionId: string,
    patch: Partial<QuestionState>
  ) =>
    setStateById((current) => ({
      ...current,
      [questionId]: {
        ...(current[questionId] ?? EMPTY_QUESTION_STATE),
        ...patch
      }
    }))

  const stateFor = (questionId: string | undefined): QuestionState =>
    stateById[questionId ?? ''] ?? EMPTY_QUESTION_STATE

  const isRevealed = (questionId: string | undefined) =>
    questionId !== undefined &&
    (stateById[questionId]?.verdict != null ||
      answeredBeforeMount.has(questionId))

  const isRecorded = (questionId: string) => {
    if (answeredBeforeMount.has(questionId)) return true
    const recorded = stateById[questionId]
    if (!recorded?.verdict) return false
    return (
      recorded.verdict.verdict !== 'no-match' ||
      recorded.selfGradeOutcome !== null
    )
  }

  const verdictFor = (questionId: string) =>
    stateById[questionId]?.verdict ?? null

  return {
    patchQuestionState,
    stateFor,
    isRevealed,
    isRecorded,
    verdictFor
  }
}
