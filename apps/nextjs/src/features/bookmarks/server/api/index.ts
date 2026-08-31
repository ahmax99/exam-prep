import 'server-only'
import { AppError } from '@/features/error/lib/AppError'
import { catchAsyncError } from '@/features/error/utils/catchError'
import {
  type MasteryState,
  type QuestionType,
  getPrismaClient
} from '@/lib/prisma'

export interface BookmarkRecord {
  questionId: string
  note: string | null
  createdAt: Date
}

export interface BookmarkListItem {
  questionId: string
  note: string | null
  createdAt: Date
  objective: string
  type: QuestionType
  examCode: string
  prompt: string
  state: MasteryState | null
}

const requireQuestion = async (
  db: Awaited<ReturnType<typeof getPrismaClient>>,
  questionId: string
) => {
  const question = await db.question.findUnique({
    where: { id: questionId },
    select: { id: true }
  })
  if (!question) throw new AppError('NOT_FOUND', 'Question not found')
}

const runSetBookmark = async (input: {
  questionId: string
  note?: string | null
}) => {
  const db = await getPrismaClient()
  await requireQuestion(db, input.questionId)

  return db.bookmark.upsert({
    where: { questionId: input.questionId },
    // An absent `note` (undefined) leaves an existing note untouched.
    create: { questionId: input.questionId, note: input.note ?? null },
    update: input.note === undefined ? {} : { note: input.note },
    select: { questionId: true, note: true, createdAt: true }
  })
}

export const setBookmark = (input: {
  questionId: string
  note?: string | null
}) => catchAsyncError(runSetBookmark(input))

const runRemoveBookmark = async (questionId: string) => {
  const db = await getPrismaClient()
  await requireQuestion(db, questionId)

  // deleteMany matches zero rows without throwing, which is what makes
  // DELETE idempotent — no P2025 handling needed.
  await db.bookmark.deleteMany({ where: { questionId } })
}

export const removeBookmark = (questionId: string) =>
  catchAsyncError(runRemoveBookmark(questionId))

const runListBookmarks = async (certSlug: string) => {
  const db = await getPrismaClient()

  const rows = await db.bookmark.findMany({
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
    state: row.question.progress?.state ?? null
  }))
}

export const listBookmarks = (certSlug: string) =>
  catchAsyncError(runListBookmarks(certSlug))

const runCountBookmarks = async (certSlug: string) => {
  const db = await getPrismaClient()
  return db.bookmark.count({
    where: { question: { exam: { certification: { slug: certSlug } } } }
  })
}

export const countBookmarks = (certSlug: string) =>
  catchAsyncError(runCountBookmarks(certSlug))
