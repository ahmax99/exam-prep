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

  const percent = total === 0 ? 0 : Math.round((score / total) * 100)

  return { rightFirstTry, selfGraded, missed, skipped, score, total, percent }
}

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

export const toPercent = (score: number, total: number) =>
  total === 0 ? 0 : Math.round((score / total) * 100)

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
