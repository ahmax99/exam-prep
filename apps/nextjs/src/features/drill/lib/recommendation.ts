import type { StartRunInput } from '@/features/drill/schemas/startRun.schema'

type RecommendedScopeKind = Extract<
  StartRunInput['scopeKind'],
  'MISSED' | 'UNSEEN' | 'EXAM' | 'CERT'
>

export interface DrillRecommendation {
  scopeKind: RecommendedScopeKind
  scopeValue: string
  available: number
  headline: string
}

interface ExamCounts {
  code: string
  missed: number
  unseen: number
  total: number
}

// Misses and new questions are recommended one exam at a time, in the order
// given, so a recommended drill never mixes two exams.
export const recommendDrill = (input: {
  certSlug: string
  questionCount: number
  exams: ExamCounts[]
}): DrillRecommendation => {
  const withMisses = input.exams.find((exam) => exam.missed > 0)
  if (withMisses)
    return {
      scopeKind: 'MISSED',
      scopeValue: withMisses.code,
      available: withMisses.missed,
      headline: `Start with what you missed in exam ${withMisses.code}`
    }

  const withUnseen = input.exams.find((exam) => exam.unseen > 0)
  if (withUnseen)
    return {
      scopeKind: 'UNSEEN',
      scopeValue: withUnseen.code,
      available: withUnseen.unseen,
      headline: `Cover new ground in exam ${withUnseen.code}`
    }

  const [onlyExam] = input.exams
  if (onlyExam && input.exams.length === 1)
    return {
      scopeKind: 'EXAM',
      scopeValue: onlyExam.code,
      available: onlyExam.total,
      headline: `Work through exam ${onlyExam.code}`
    }

  return {
    scopeKind: 'CERT',
    scopeValue: input.certSlug,
    available: input.questionCount,
    headline: 'Work through everything'
  }
}
