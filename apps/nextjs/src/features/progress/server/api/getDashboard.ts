import 'server-only'
import { cache } from 'react'

import {
  type MasteryCounts,
  sumMastery,
  tallyMastery
} from '@/features/progress/lib/mastery'
import { prisma } from '@/lib/prisma'
import { toPercent } from '@/utils/toPercent'

export interface ExamMastery extends MasteryCounts {
  code: string
}

export interface CertificationMastery extends MasteryCounts {
  certificationId: string
  slug: string
  masteryPercent: number
  // Ordered by exam code, so callers can pick "the first exam with misses".
  exams: ExamMastery[]
}

export const getDashboard = cache(async (): Promise<CertificationMastery[]> => {
  const certifications = await prisma.certification.findMany({
    select: {
      id: true,
      slug: true,
      exams: {
        select: {
          code: true,
          questions: { select: { progress: { select: { state: true } } } }
        },
        orderBy: { code: 'asc' }
      }
    },
    orderBy: { slug: 'asc' }
  })

  return certifications.map(({ id, slug, exams }) => {
    const examMastery = exams.map(({ code, questions }) => ({
      code,
      ...tallyMastery(questions)
    }))
    const totals = sumMastery(examMastery)

    return {
      certificationId: id,
      slug,
      ...totals,
      masteryPercent: toPercent(totals.mastered, totals.total),
      exams: examMastery
    }
  })
})
