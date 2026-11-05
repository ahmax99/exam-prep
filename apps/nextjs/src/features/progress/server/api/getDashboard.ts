import 'server-only'
import { cache } from 'react'

import { getPrismaClient, type MasteryState } from '@/lib/prisma'
import { toPercent } from '@/utils/toPercent'

interface MasteryCounts {
  mastered: number
  shaky: number
  missed: number
  unseen: number
  attempted: number
  total: number
}

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

const countExam = async (examId: string): Promise<MasteryCounts> => {
  const db = await getPrismaClient()
  const scope = { examId }

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
    mastered,
    shaky,
    missed,
    unseen: total - attempted,
    attempted,
    total
  }
}

const sumCounts = (exams: MasteryCounts[]): MasteryCounts =>
  exams.reduce(
    (sum, exam) => ({
      mastered: sum.mastered + exam.mastered,
      shaky: sum.shaky + exam.shaky,
      missed: sum.missed + exam.missed,
      unseen: sum.unseen + exam.unseen,
      attempted: sum.attempted + exam.attempted,
      total: sum.total + exam.total
    }),
    { mastered: 0, shaky: 0, missed: 0, unseen: 0, attempted: 0, total: 0 }
  )

export const getDashboard = cache(async (): Promise<CertificationMastery[]> => {
  const db = await getPrismaClient()

  const certifications = await db.certification.findMany({
    select: {
      id: true,
      slug: true,
      exams: { select: { id: true, code: true }, orderBy: { code: 'asc' } }
    },
    orderBy: { slug: 'asc' }
  })

  return Promise.all(
    certifications.map(async ({ id, slug, exams }) => {
      const examMastery = await Promise.all(
        exams.map(async (exam) => ({
          code: exam.code,
          ...(await countExam(exam.id))
        }))
      )
      const totals = sumCounts(examMastery)

      return {
        certificationId: id,
        slug,
        ...totals,
        masteryPercent: toPercent(totals.mastered, totals.total),
        exams: examMastery
      }
    })
  )
})
