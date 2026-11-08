import 'server-only'
import {
  groupBy,
  type MasteryCounts,
  tallyMastery
} from '@/features/progress/lib/mastery'
import { prisma } from '@/lib/prisma'

export interface TopicMastery extends MasteryCounts {
  topic: string
}

export const getTopicMastery = async (
  certSlug: string,
  examCode: string
): Promise<TopicMastery[]> => {
  const questions = await prisma.question.findMany({
    where: { exam: { code: examCode, certification: { slug: certSlug } } },
    select: { topic: true, progress: { select: { state: true } } },
    orderBy: { topic: 'asc' }
  })

  return groupBy(questions, (question) => question.topic).map((group) => ({
    topic: group[0]?.topic ?? '',
    ...tallyMastery(group)
  }))
}
