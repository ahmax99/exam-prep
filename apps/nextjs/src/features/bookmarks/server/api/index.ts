import 'server-only'
import { AppError } from '@/features/error/lib/AppError'
import { type MasteryState, prisma, type QuestionType } from '@/lib/prisma'

export interface BookmarkListItem {
  questionId: string
  note: string | null
  createdAt: Date
  objective: string
  type: QuestionType
  examCode: string
  prompt: string
  options: { letter: string; text: string }[]
  correctLetters: string[]
  answerDisplay: string | null
  explanation: string
  state: MasteryState | null
}

const requireQuestion = async (questionId: string) => {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { id: true }
  })
  if (!question) throw new AppError('NOT_FOUND', 'Question not found')
}

export const setBookmark = async (input: {
  questionId: string
  note?: string | null
}) => {
  await requireQuestion(input.questionId)

  return prisma.bookmark.upsert({
    where: { questionId: input.questionId },

    create: { questionId: input.questionId, note: input.note ?? null },
    update: input.note === undefined ? {} : { note: input.note },
    select: { questionId: true, note: true, createdAt: true }
  })
}

export const removeBookmark = async (questionId: string) => {
  await requireQuestion(questionId)

  await prisma.bookmark.deleteMany({ where: { questionId } })
}

export const listBookmarks = async (certSlug: string) => {
  const rows = await prisma.bookmark.findMany({
    where: { question: { exam: { certification: { slug: certSlug } } } },
    orderBy: { createdAt: 'desc' },
    select: {
      questionId: true,
      note: true,
      createdAt: true,
      question: {
        select: {
          objective: true,
          type: true,
          prompt: true,
          options: {
            select: { letter: true, text: true },
            orderBy: { letter: 'asc' }
          },
          correctLetters: true,
          answerDisplay: true,
          explanation: true,
          exam: { select: { code: true } },
          progress: { select: { state: true } }
        }
      }
    }
  })

  return rows.map((row): BookmarkListItem => ({
    questionId: row.questionId,
    note: row.note,
    createdAt: row.createdAt,
    objective: row.question.objective,
    type: row.question.type,
    examCode: row.question.exam.code,
    prompt: row.question.prompt,
    options: row.question.options,
    correctLetters: row.question.correctLetters,
    answerDisplay: row.question.answerDisplay,
    explanation: row.question.explanation,
    state: row.question.progress?.state ?? null
  }))
}

export const countBookmarks = async (certSlug: string) => {
  return prisma.bookmark.count({
    where: { question: { exam: { certification: { slug: certSlug } } } }
  })
}
