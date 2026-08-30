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

    return db.$queryRaw<CertificationSummary[]>`
      SELECT c.id, c.slug, c.name, c.vendor,
        COUNT(DISTINCT e.id)::int AS "examCount",
        COUNT(q.id)::int AS "questionCount"
      FROM "Certification" c
      LEFT JOIN "Exam" e ON e."certificationId" = c.id
      LEFT JOIN "Question" q ON q."examId" = e.id
      GROUP BY c.id, c.slug, c.name, c.vendor
      ORDER BY c.name ASC
    `
  }
)
