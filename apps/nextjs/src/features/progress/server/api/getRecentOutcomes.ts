import 'server-only'
import { getPrismaClient } from '@/lib/prisma'

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
  const db = await getPrismaClient()
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const [row] = await db.$queryRaw<RecentOutcomes[]>`
    SELECT
      COUNT(*) FILTER (WHERE a."isCorrect" AND NOT a."selfGraded")::int AS "rightFirstTry",
      COUNT(*) FILTER (WHERE a."isCorrect" AND a."selfGraded")::int AS "selfGraded",
      COUNT(*) FILTER (WHERE NOT a."isCorrect")::int AS missed
    FROM "Attempt" a
    JOIN "Question" q ON q.id = a."questionId"
    JOIN "Exam" e ON e.id = q."examId"
    JOIN "Certification" c ON c.id = e."certificationId"
    WHERE c.slug = ${certSlug} AND a."createdAt" >= ${since}
  `

  return row ?? { rightFirstTry: 0, selfGraded: 0, missed: 0 }
}
