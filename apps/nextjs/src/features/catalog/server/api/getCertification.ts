import 'server-only'
import { AppError } from '@/features/error/lib/AppError'
import { getPrismaClient } from '@/lib/prisma'

export interface CertificationExam {
  code: string
  title: string
  questionCount: number
  topicCount: number
  objectiveCount: number
}

export interface CertificationDetail {
  id: string
  slug: string
  name: string
  vendor: string
  exams: CertificationExam[]
}

export const getCertification = async (
  slug: string
): Promise<CertificationDetail> => {
  const db = await getPrismaClient()

  const certification = await db.certification.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true, vendor: true }
  })

  if (!certification)
    throw new AppError('NOT_FOUND', `Certification "${slug}" not found`)

  const exams = await db.$queryRaw<CertificationExam[]>`
    SELECT e.code, e.title,
      COUNT(q.id)::int AS "questionCount",
      COUNT(DISTINCT q.topic)::int AS "topicCount",
      COUNT(DISTINCT q.objective)::int AS "objectiveCount"
    FROM "Exam" e
    LEFT JOIN "Question" q ON q."examId" = e.id
    WHERE e."certificationId" = ${certification.id}
    GROUP BY e.id, e.code, e.title
    ORDER BY e.code ASC
  `

  return { ...certification, exams }
}
