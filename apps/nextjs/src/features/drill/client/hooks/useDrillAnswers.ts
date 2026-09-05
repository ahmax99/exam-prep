'use client'

import { useState } from 'react'

import {
  answerPhase,
  type AnswerPhase,
  type SelfGradeOutcome
} from '@/features/drill/lib/answerPhase'
import type { AnswerVerdict } from '@/features/drill/schemas/answerVerdict.schema'

export type { SelfGradeOutcome }

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

  const phaseFor = (questionId: string | undefined): AnswerPhase =>
    answerPhase(stateFor(questionId))

  const isRevealed = (questionId: string | undefined) =>
    questionId !== undefined &&
    (stateById[questionId]?.verdict != null ||
      answeredBeforeMount.has(questionId))

  const isRecorded = (questionId: string) =>
    answeredBeforeMount.has(questionId) || phaseFor(questionId) === 'recorded'

  const verdictFor = (questionId: string) =>
    stateById[questionId]?.verdict ?? null

  return {
    patchQuestionState,
    stateFor,
    phaseFor,
    isRevealed,
    isRecorded,
    verdictFor
  }
}
