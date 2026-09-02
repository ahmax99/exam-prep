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

// Placeholder copy — flagged for #39's voice pass.
const HEADLINES: Record<
  Exclude<RecommendedScopeKind, 'EXAM' | 'CERT'>,
  string
> = {
  MISSED: 'Questions you got wrong',
  UNSEEN: 'Questions you have never seen'
}

// Decides what a certification's primary "Drill" action should target:
// missed questions first, then unseen, then the selected exam if one is
// known, else every question in the certification (the `/` landing page has
// no selected exam yet).
export const recommendDrill = (input: {
  certSlug: string
  missed: number
  unseen: number
  questionCount: number
  examCode?: string
  examQuestionCount?: number
}): DrillRecommendation => {
  if (input.missed > 0)
    return {
      scopeKind: 'MISSED',
      scopeValue: input.certSlug,
      available: input.missed,
      headline: HEADLINES.MISSED
    }

  if (input.unseen > 0)
    return {
      scopeKind: 'UNSEEN',
      scopeValue: input.certSlug,
      available: input.unseen,
      headline: HEADLINES.UNSEEN
    }

  if (input.examCode !== undefined && input.examQuestionCount !== undefined)
    return {
      scopeKind: 'EXAM',
      scopeValue: input.examCode,
      available: input.examQuestionCount,
      headline: `Everything in ${input.examCode}`
    }

  return {
    scopeKind: 'CERT',
    scopeValue: input.certSlug,
    available: input.questionCount,
    headline: 'Everything in this certification'
  }
}
