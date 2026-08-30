import 'server-only'
import { getPrismaClient } from '@/lib/prisma'

export interface QuestionMix {
  fillIn: number
  singleAnswer: number
  multipleAnswer: number
}

export const getQuestionMix = async (
  certSlug: string,
  examCode: string
): Promise<QuestionMix> => {
  const db = await getPrismaClient()

  const [row] = await db.$queryRaw<QuestionMix[]>`
    SELECT
      COUNT(*) FILTER (WHERE q.type = 'FILL_IN')::int AS "fillIn",
      COUNT(*) FILTER (WHERE q.type = 'SINGLE_ANSWER')::int AS "singleAnswer",
      COUNT(*) FILTER (WHERE q.type = 'MULTIPLE_ANSWER')::int AS "multipleAnswer"
    FROM "Question" q
    JOIN "Exam" e ON e.id = q."examId"
    JOIN "Certification" c ON c.id = e."certificationId"
    WHERE c.slug = ${certSlug} AND e.code = ${examCode}
  `

  return row ?? { fillIn: 0, singleAnswer: 0, multipleAnswer: 0 }
}
