import 'server-only'
import { cache } from 'react'

import { getPrismaClient } from '@/lib/prisma'

export interface CertificationSummary {
  id: string
  slug: string
  name: string
  vendor: string
  examCount: number
  questionCount: number
}

export const getCertifications = cache(
  async (): Promise<CertificationSummary[]> => {
    const db = await getPrismaClient()

    const certifications = await db.certification.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        vendor: true,
        exams: { select: { _count: { select: { questions: true } } } }
      },
      orderBy: { name: 'asc' }
    })

    return certifications.map(({ exams, ...certification }) => ({
      ...certification,
      examCount: exams.length,
      questionCount: exams.reduce(
        (total, exam) => total + exam._count.questions,
        0
      )
    }))
  }
)
