import 'server-only'
import { WEAKEST_OBJECTIVES_LIMIT } from '@/features/progress/constants'
import { getPrismaClient } from '@/lib/prisma'

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

  const rows = await db.$queryRaw<ObjectiveRow[]>`
    SELECT q.objective, q.topic,
      COUNT(*) FILTER (WHERE qp.state = 'MASTERED')::int AS mastered,
      COUNT(*)::int AS total
    FROM "Question" q
    JOIN "Exam" e ON e.id = q."examId"
    JOIN "Certification" c ON c.id = e."certificationId"
    LEFT JOIN "QuestionProgress" qp ON qp."questionId" = q.id
    WHERE c.slug = ${certSlug}
    GROUP BY q.objective, q.topic
    ORDER BY ROUND(mastered::numeric / total * 100) ASC, total DESC, q.objective ASC
    LIMIT ${limit}
  `

  return rows.map((row) => ({
    ...row,
    masteryPercent: Math.round((row.mastered / row.total) * 100)
  }))
}
