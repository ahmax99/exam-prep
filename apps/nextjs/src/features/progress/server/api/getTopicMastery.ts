import 'server-only'
import { getPrismaClient } from '@/lib/prisma'

export interface TopicMastery {
  topic: string
  mastered: number
  shaky: number
  total: number
}

export const getTopicMastery = async (
  certSlug: string,
  examCode: string
): Promise<TopicMastery[]> => {
  const db = await getPrismaClient()

  const questions = await db.question.findMany({
    where: { exam: { code: examCode, certification: { slug: certSlug } } },
    select: { topic: true, progress: { select: { state: true } } },
    orderBy: { topic: 'asc' }
  })

  const byTopic = new Map<string, TopicMastery>()

  for (const { topic, progress } of questions) {
    const mastery = byTopic.get(topic) ?? {
      topic,
      mastered: 0,
      shaky: 0,
      total: 0
    }

    mastery.total += 1
    if (progress?.state === 'MASTERED') mastery.mastered += 1
    else if (progress?.state === 'SHAKY') mastery.shaky += 1

    byTopic.set(topic, mastery)
  }

  return [...byTopic.values()]
}
