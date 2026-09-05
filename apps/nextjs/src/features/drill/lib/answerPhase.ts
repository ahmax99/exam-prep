import type { AnswerVerdict } from '@/features/drill/schemas/answerVerdict.schema'

export type SelfGradeOutcome = 'had-it' | 'missed-it'

export type AnswerPhase = 'unanswered' | 'awaiting-self-grade' | 'recorded'

interface PhaseInput {
  verdict: AnswerVerdict | null
  selfGradeOutcome: SelfGradeOutcome | null
}

export const answerPhase = ({
  verdict,
  selfGradeOutcome
}: PhaseInput): AnswerPhase => {
  if (!verdict) return 'unanswered'
  if (verdict.verdict === 'no-match' && selfGradeOutcome === null)
    return 'awaiting-self-grade'
  return 'recorded'
}

export const isSelfGrading = (state: PhaseInput) =>
  answerPhase(state) === 'awaiting-self-grade' ||
  state.selfGradeOutcome !== null
