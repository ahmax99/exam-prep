import type { MasteryState } from '@/lib/prisma'

export interface MasteryCounts {
  mastered: number
  shaky: number
  missed: number
  unseen: number
  attempted: number
  total: number
}

interface WithProgress {
  progress: { state: MasteryState } | null
}

const EMPTY_COUNTS: MasteryCounts = {
  mastered: 0,
  shaky: 0,
  missed: 0,
  unseen: 0,
  attempted: 0,
  total: 0
}

const COUNT_KEY: Record<MasteryState, 'mastered' | 'shaky' | 'missed'> = {
  MASTERED: 'mastered',
  SHAKY: 'shaky',
  WRONG: 'missed'
}

// A question with no progress row has never been answered.
export const tallyMastery = (questions: readonly WithProgress[]) => {
  const counts = { ...EMPTY_COUNTS, total: questions.length }
  for (const { progress } of questions)
    if (progress) counts[COUNT_KEY[progress.state]] += 1

  counts.attempted = counts.mastered + counts.shaky + counts.missed
  counts.unseen = counts.total - counts.attempted
  return counts
}

export const sumMastery = (all: readonly MasteryCounts[]): MasteryCounts =>
  all.reduce(
    (sum, counts) => ({
      mastered: sum.mastered + counts.mastered,
      shaky: sum.shaky + counts.shaky,
      missed: sum.missed + counts.missed,
      unseen: sum.unseen + counts.unseen,
      attempted: sum.attempted + counts.attempted,
      total: sum.total + counts.total
    }),
    EMPTY_COUNTS
  )

// Groups rows by key, keeping the order each key first appears in.
export const groupBy = <Row>(
  rows: readonly Row[],
  keyOf: (row: Row) => string
): Row[][] => {
  const groups = new Map<string, Row[]>()
  for (const row of rows) {
    const key = keyOf(row)
    groups.set(key, [...(groups.get(key) ?? []), row])
  }
  return [...groups.values()]
}
