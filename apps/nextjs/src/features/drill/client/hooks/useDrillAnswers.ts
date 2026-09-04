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

/**
 * Every question's answer state for one run, plus the two questions callers ask
 * about it: has this one been revealed, and has the server actually recorded it.
 *
 * `answeredQuestionIds` are the attempts written before this mounted (a resumed
 * run): the server has them, the client never received their verdicts, so they
 * read as answered with no detail to show.
 */
export const useDrillAnswers = (answeredQuestionIds: string[]) => {
  // Keyed by question id, not index: a run's questionIds are unique and frozen,
  // so the id is the stable identity across backward navigation.
  const [stateById, setStateById] = useState<Record<string, QuestionState>>({})

  // No useMemo: React Compiler (reactCompiler: true) auto-memoizes this.
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

  // Takes an optional id for the same reason stateFor does: the card asks about
  // "the current question", which is undefined for an out-of-range cursor.
  const isRevealed = (questionId: string | undefined) =>
    questionId !== undefined &&
    (stateById[questionId]?.verdict != null ||
      answeredBeforeMount.has(questionId))

  // Stricter than isRevealed, and deliberately so: a no-match verdict reveals
  // the answer but writes no attempt until it is self-graded (runSubmitAnswer),
  // so anything counting unanswered questions has to track what the server
  // recorded — otherwise a question abandoned mid-self-grade silently drops out.
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
