import 'server-only'
import { prisma } from '@/lib/prisma'

export const RECENT_OUTCOME_DAYS = 7

export interface RecentOutcomes {
  rightFirstTry: number
  selfGraded: number
  missed: number
}

export const getRecentOutcomes = async (
  certSlug: string,
  days: number = RECENT_OUTCOME_DAYS
): Promise<RecentOutcomes> => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const groups = await prisma.attempt.groupBy({
    by: ['isCorrect', 'selfGraded'],
    where: {
      createdAt: { gte: since },
      question: { exam: { certification: { slug: certSlug } } }
    },
    _count: { _all: true }
  })

  return groups.reduce<RecentOutcomes>(
    (outcomes, group) => {
      const count = group._count._all
      if (!group.isCorrect) outcomes.missed += count
      else if (group.selfGraded) outcomes.selfGraded += count
      else outcomes.rightFirstTry += count
      return outcomes
    },
    { rightFirstTry: 0, selfGraded: 0, missed: 0 }
  )
}
