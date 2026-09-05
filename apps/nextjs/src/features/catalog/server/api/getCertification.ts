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

  const exams = await db.exam.findMany({
    where: { certificationId: certification.id },
    select: {
      code: true,
      title: true,
      questions: { select: { topic: true, objective: true } }
    },
    orderBy: { code: 'asc' }
  })

  return {
    ...certification,
    exams: exams.map(({ questions, ...exam }) => ({
      ...exam,
      questionCount: questions.length,
      topicCount: new Set(questions.map((question) => question.topic)).size,
      objectiveCount: new Set(questions.map((question) => question.objective))
        .size
    }))
  }
}
