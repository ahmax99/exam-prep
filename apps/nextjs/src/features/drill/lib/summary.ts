import type { StartRunInput } from '@/features/drill/schemas/startRun.schema'

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

// The four buckets are disjoint and sum to `total`; `score` separately
// derives the headline (a self-graded "I had it" still counts as correct).
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
  // Guards an all-skipped run (total === 0 or every question skipped) from NaN%.
  const percent = total === 0 ? 0 : Math.round((score / total) * 100)

  return { rightFirstTry, selfGraded, missed, skipped, score, total, percent }
}

// Mirrors queue.ts's SCOPE_WHERE_BUILDERS shape: one function per scope kind,
// keyed for exhaustiveness rather than a switch.
const SCOPE_DESCRIPTIONS: Record<
  StartRunInput['scopeKind'],
  (scopeValue: string) => string
> = {
  CERT: () => 'across the full certification',
  EXAM: (scopeValue) => `in exam ${scopeValue}`,
  TOPIC: (scopeValue) => `in ${scopeValue}`,
  OBJECTIVE: (scopeValue) => `in objective ${scopeValue}`,
  MISSED: () => 'from your weak spots',
  UNSEEN: () => 'that were new to you',
  BOOKMARKS: () => 'from your bookmarks'
}

export const describeScope = (
  scopeKind: StartRunInput['scopeKind'],
  scopeValue: string
): string => SCOPE_DESCRIPTIONS[scopeKind](scopeValue)

// The summary's opening line: what happened, in words, before any digit.
// Score/percent stay available as secondary, smaller text alongside this.
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

const toPercent = (score: number, total: number) =>
  total === 0 ? 0 : Math.round((score / total) * 100)

// `runs` arrives newest-first; each row's predecessor is the next element
// (the run immediately before it in time), so the oldest run has no delta.
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
