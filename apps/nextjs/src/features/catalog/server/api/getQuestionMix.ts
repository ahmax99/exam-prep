import 'server-only'
import { getPrismaClient, type QuestionType } from '@/lib/prisma'

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

  const groups = await db.question.groupBy({
    by: ['type'],
    where: { exam: { code: examCode, certification: { slug: certSlug } } },
    _count: { _all: true }
  })

  // A type absent from the groups has no questions, so it counts as zero.
  const countOf = (type: QuestionType) =>
    groups.find((group) => group.type === type)?._count._all ?? 0

  return {
    fillIn: countOf('FILL_IN'),
    singleAnswer: countOf('SINGLE_ANSWER'),
    multipleAnswer: countOf('MULTIPLE_ANSWER')
  }
}
