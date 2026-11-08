import 'server-only'
import { WEAKEST_OBJECTIVES_LIMIT } from '@/features/progress/constants'
import { groupBy, tallyMastery } from '@/features/progress/lib/mastery'
import { prisma } from '@/lib/prisma'
import { toPercent } from '@/utils/toPercent'

export interface WeakestObjective {
  objective: string
  topic: string
  mastered: number
  total: number
  masteryPercent: number
}

export const getWeakestObjectives = async (
  certSlug: string,
  limit: number = WEAKEST_OBJECTIVES_LIMIT
): Promise<WeakestObjective[]> => {
  const questions = await prisma.question.findMany({
    where: { exam: { certification: { slug: certSlug } } },
    select: {
      objective: true,
      topic: true,
      progress: { select: { state: true } }
    }
  })

  return groupBy(questions, ({ topic, objective }) =>
    JSON.stringify([topic, objective])
  )
    .map((group) => {
      const { mastered, total } = tallyMastery(group)
      return {
        objective: group[0]?.objective ?? '',
        topic: group[0]?.topic ?? '',
        mastered,
        total,
        masteryPercent: toPercent(mastered, total)
      }
    })
    .sort(
      (a, b) =>
        a.masteryPercent - b.masteryPercent ||
        b.total - a.total ||
        a.objective.localeCompare(b.objective)
    )
    .slice(0, limit)
}
