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

  return db.$queryRaw<TopicMastery[]>`
    SELECT q.topic,
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE qp.state = 'MASTERED')::int AS mastered,
      COUNT(*) FILTER (WHERE qp.state = 'SHAKY')::int AS shaky
    FROM "Question" q
    JOIN "Exam" e ON e.id = q."examId"
    JOIN "Certification" c ON c.id = e."certificationId"
    LEFT JOIN "QuestionProgress" qp ON qp."questionId" = q.id
    WHERE c.slug = ${certSlug} AND e.code = ${examCode}
    GROUP BY q.topic
    ORDER BY q.topic ASC
  `
}
