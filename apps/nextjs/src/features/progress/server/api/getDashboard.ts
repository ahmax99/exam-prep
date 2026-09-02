import 'server-only'
import { cache } from 'react'

import { getPrismaClient } from '@/lib/prisma'

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

interface MasteryRow {
  certificationId: string
  slug: string
  total: number
  mastered: number
  shaky: number
  missed: number
}

export const getDashboard = cache(async (): Promise<CertificationMastery[]> => {
  const db = await getPrismaClient()

  const rows = await db.$queryRaw<MasteryRow[]>`
      SELECT c.id AS "certificationId", c.slug,
        COUNT(q.id)::int AS total,
        COUNT(*) FILTER (WHERE qp.state = 'MASTERED')::int AS mastered,
        COUNT(*) FILTER (WHERE qp.state = 'SHAKY')::int AS shaky,
        COUNT(*) FILTER (WHERE qp.state = 'WRONG')::int AS missed
      FROM "Certification" c
      LEFT JOIN "Exam" e ON e."certificationId" = c.id
      LEFT JOIN "Question" q ON q."examId" = e.id
      LEFT JOIN "QuestionProgress" qp ON qp."questionId" = q.id
      GROUP BY c.id, c.slug
      ORDER BY c.slug ASC
    `

  return rows.map((row) => {
    const unseen = row.total - row.mastered - row.shaky - row.missed
    // MasteryState is exactly WRONG|SHAKY|MASTERED and a missing QuestionProgress
    // row means "unseen", so this sum is the certification's attempt existence check.
    const attempted = row.mastered + row.shaky + row.missed
    const masteryPercent =
      row.total === 0 ? 0 : Math.round((row.mastered / row.total) * 100)
    return { ...row, unseen, attempted, masteryPercent }
  })
})
