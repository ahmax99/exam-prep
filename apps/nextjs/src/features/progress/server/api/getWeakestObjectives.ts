import 'server-only'
import { WEAKEST_OBJECTIVES_LIMIT } from '@/features/progress/constants'
import { getPrismaClient } from '@/lib/prisma'
import { toPercent } from '@/utils/toPercent'

export interface WeakestObjective {
  objective: string
  topic: string
  mastered: number
  total: number
  masteryPercent: number
}

interface ObjectiveRow {
  objective: string
  topic: string
  mastered: number
  total: number
}

export const getWeakestObjectives = async (
  certSlug: string,
  limit: number = WEAKEST_OBJECTIVES_LIMIT
): Promise<WeakestObjective[]> => {
  const db = await getPrismaClient()

  const questions = await db.question.findMany({
    where: { exam: { certification: { slug: certSlug } } },
    select: {
      objective: true,
      topic: true,
      progress: { select: { state: true } }
    }
  })

  const byObjective = new Map<string, ObjectiveRow>()

  for (const { objective, topic, progress } of questions) {
    const key = JSON.stringify([topic, objective])
    const row = byObjective.get(key) ?? {
      objective,
      topic,
      mastered: 0,
      total: 0
    }

    row.total += 1
    if (progress?.state === 'MASTERED') row.mastered += 1

    byObjective.set(key, row)
  }

  return [...byObjective.values()]
    .map((row) => ({
      ...row,
      masteryPercent: toPercent(row.mastered, row.total)
    }))
    .sort(
      (a, b) =>
        a.masteryPercent - b.masteryPercent ||
        b.total - a.total ||
        a.objective.localeCompare(b.objective)
    )
    .slice(0, limit)
}
