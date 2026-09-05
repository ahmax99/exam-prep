import 'server-only'
import { cache } from 'react'

import { getPrismaClient, type MasteryState } from '@/lib/prisma'
import { toPercent } from '@/utils/toPercent'

export interface CertificationMastery {
  certificationId: string
  slug: string
  mastered: number
  shaky: number
  missed: number
  unseen: number
  attempted: number
  total: number
  masteryPercent: number
}

export const getDashboard = cache(async (): Promise<CertificationMastery[]> => {
  const db = await getPrismaClient()

  const certifications = await db.certification.findMany({
    select: { id: true, slug: true },
    orderBy: { slug: 'asc' }
  })

  return Promise.all(
    certifications.map(async ({ id, slug }) => {
      const scope = { exam: { certificationId: id } }

      const [total, states] = await Promise.all([
        db.question.count({ where: scope }),
        db.questionProgress.groupBy({
          by: ['state'],
          where: { question: scope },
          _count: { _all: true }
        })
      ])

      const countOf = (state: MasteryState) =>
        states.find((group) => group.state === state)?._count._all ?? 0

      const mastered = countOf('MASTERED')
      const shaky = countOf('SHAKY')
      const missed = countOf('WRONG')

      const attempted = mastered + shaky + missed

      return {
        certificationId: id,
        slug,
        mastered,
        shaky,
        missed,
        unseen: total - attempted,
        attempted,
        total,
        masteryPercent: toPercent(mastered, total)
      }
    })
  )
})
