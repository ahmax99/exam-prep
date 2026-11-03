import type { StartRunInput } from '@/features/drill/schemas/startRun.schema'
import { toPercent } from '@/utils/toPercent'

export interface RunOutcomes {
  rightFirstTry: number
  selfGraded: number
  missed: number
  skipped: number
  score: number
  total: number
  percent: number
}

export interface AttemptOutcome {
  questionId: string
  isCorrect: boolean
  selfGraded: boolean
}

export const summarizeOutcomes = (
  questionIds: string[],
  attempts: AttemptOutcome[]
): RunOutcomes => {
  let rightFirstTry = 0
  let selfGraded = 0
  let missed = 0

  for (const attempt of attempts) {
    if (!attempt.isCorrect) missed++
    else if (attempt.selfGraded) selfGraded++
    else rightFirstTry++
  }

  const total = questionIds.length
  const skipped = total - attempts.length
  const score = rightFirstTry + selfGraded

  const percent = toPercent(score, total)

  return { rightFirstTry, selfGraded, missed, skipped, score, total, percent }
}

// Runs from before MISSED/UNSEEN were per exam stored the cert slug instead.
const examSuffix = (scopeValue: string, certSlug: string) =>
  scopeValue && scopeValue !== certSlug ? ` in exam ${scopeValue}` : ''

const SCOPE_DESCRIPTIONS: Record<
  StartRunInput['scopeKind'],
  (scopeValue: string, certSlug: string) => string
> = {
  CERT: () => 'across the full certification',
  EXAM: (scopeValue) => `in exam ${scopeValue}`,
  TOPIC: (scopeValue) => `in ${scopeValue}`,
  OBJECTIVE: (scopeValue) => `in objective ${scopeValue}`,
  MISSED: (scopeValue, certSlug) =>
    `from your weak spots${examSuffix(scopeValue, certSlug)}`,
  UNSEEN: (scopeValue, certSlug) =>
    `that were new to you${examSuffix(scopeValue, certSlug)}`,
  BOOKMARKS: (scopeValue) =>
    scopeValue
      ? `from your exam ${scopeValue} bookmarks`
      : 'from your bookmarks'
}

export const describeScope = (
  scopeKind: StartRunInput['scopeKind'],
  scopeValue: string,
  certSlug: string
): string => SCOPE_DESCRIPTIONS[scopeKind](scopeValue, certSlug)

// "Drill weak spots" stays inside one exam: the one this run missed most in.
export const weakSpotsExamCode = (
  misses: { exam: { code: string } }[]
): string | null => {
  const counts = new Map<string, number>()
  for (const { exam } of misses)
    counts.set(exam.code, (counts.get(exam.code) ?? 0) + 1)

  let best: string | null = null
  for (const [code, count] of counts)
    if (best === null || count > (counts.get(best) ?? 0)) best = code
  return best
}

export const buildHeadline = (
  outcomes: RunOutcomes,
  scopeDescription: string
): string => {
  if (outcomes.total === 0)
    return `This run has no questions ${scopeDescription}.`

  const questionWord = outcomes.total === 1 ? 'question' : 'questions'

  if (outcomes.skipped === outcomes.total)
    return `You skipped all ${outcomes.total} ${questionWord} ${scopeDescription}.`

  const worked = `You worked through ${outcomes.total} ${questionWord} ${scopeDescription}.`
  if (outcomes.missed === 0) return `${worked} Nothing to revisit.`

  const missedWord = outcomes.missed === 1 ? 'One' : `${outcomes.missed}`
  return `${worked} ${missedWord} to revisit.`
}

export const runDateFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short'
})

export type HistoryDelta =
  | { direction: 'up' | 'down'; points: number }
  | { direction: 'even'; points: 0 }
  | null

export interface HistoryRow {
  id: string
  startedAt: Date
  score: number
  total: number
  percent: number
  delta: HistoryDelta
  isCurrent: boolean
}

export const toHistoryRows = (
  runs: { id: string; startedAt: Date; score: number; total: number }[],
  currentRunId: string
): HistoryRow[] =>
  runs.map((run, index) => {
    const percent = toPercent(run.score, run.total)
    const predecessor = runs[index + 1]
    const delta: HistoryDelta = predecessor
      ? (() => {
          const points =
            percent - toPercent(predecessor.score, predecessor.total)
          if (points === 0) return { direction: 'even', points: 0 }
          return { direction: points > 0 ? 'up' : 'down', points }
        })()
      : null

    return {
      id: run.id,
      startedAt: run.startedAt,
      score: run.score,
      total: run.total,
      percent,
      delta,
      isCurrent: run.id === currentRunId
    }
  })
