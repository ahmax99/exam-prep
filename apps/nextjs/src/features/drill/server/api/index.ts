import 'server-only'
import {
  DEFAULT_RUN_LIMIT,
  RUN_HISTORY_LIMIT
} from '@/features/drill/constants'
import { grade, type Verdict } from '@/features/drill/lib/grade'
import { nextMastery } from '@/features/drill/lib/mastery'
import { buildScopeWhere, orderQueue } from '@/features/drill/lib/queue'
import type { SelfGradeInput } from '@/features/drill/schemas/selfGrade.schema'
import type { StartRunInput } from '@/features/drill/schemas/startRun.schema'
import type { SubmitAnswerInput } from '@/features/drill/schemas/submitAnswer.schema'
import { AppError } from '@/features/error/lib/AppError'
import { catchAsyncError } from '@/features/error/utils/catchError'
import { type PrismaClient, getPrismaClient } from '@/lib/prisma'

const runStartRun = async (input: StartRunInput) => {
  const db = await getPrismaClient()
  const where = buildScopeWhere(input)

  const candidates = await db.question.findMany({
    where,
    select: { id: true, progress: { select: { state: true } } },
    orderBy: [{ exam: { code: 'asc' } }, { number: 'asc' }]
  })

  const questionIds = orderQueue(candidates, input.limit ?? DEFAULT_RUN_LIMIT)

  if (questionIds.length === 0)
    throw new AppError('NOT_FOUND', 'No questions match this scope')

  // The set is frozen here and never re-derived — getRun only ever reads it back (spec D7).
  return db.drillRun.create({
    data: {
      scopeKind: input.scopeKind,
      scopeValue: input.scopeValue,
      questionIds
    },
    select: {
      id: true,
      scopeKind: true,
      scopeValue: true,
      questionIds: true,
      startedAt: true
    }
  })
}

export const startRun = (input: StartRunInput) =>
  catchAsyncError(runStartRun(input))

const runGetRun = async (id: string) => {
  const db = await getPrismaClient()
  const run = await db.drillRun.findUnique({ where: { id } })
  if (!run) throw new AppError('NOT_FOUND', 'Run not found')

  // correctLetters/acceptedAnswers/answerDisplay/explanation are deliberately
  // excluded — they reach the client only via submitAnswer's response.
  const questions = await db.question.findMany({
    where: { id: { in: run.questionIds } },
    select: {
      id: true,
      number: true,
      objective: true,
      topic: true,
      prompt: true,
      type: true,
      options: {
        select: { letter: true, text: true },
        orderBy: { letter: 'asc' }
      },
      exam: { select: { code: true, title: true } },
      progress: { select: { timesSeen: true } }
    }
  })

  const byId = new Map(questions.map((question) => [question.id, question]))
  const ordered = run.questionIds
    .map((questionId) => byId.get(questionId))
    .filter((question) => question !== undefined)

  const answered = await db.attempt.findMany({
    where: { runId: id },
    select: { questionId: true }
  })

  return {
    run: {
      id: run.id,
      scopeKind: run.scopeKind,
      scopeValue: run.scopeValue,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt
    },
    questions: ordered,
    answeredQuestionIds: answered.map((attempt) => attempt.questionId)
  }
}

export const getRun = (id: string) => catchAsyncError(runGetRun(id))

// The `:` separator cannot occur inside a cuid, so this id is unambiguous —
// and it turns "one attempt per (run, question)" into a real DB constraint
// enforced by the primary key, with no schema.prisma change.
const attemptIdFor = (runId: string, questionId: string) =>
  `${runId}:${questionId}`

const isUniqueViolation = (error: unknown) =>
  error instanceof Error && 'code' in error && error.code === 'P2002'

const toResponseText = (response: string | string[]) =>
  Array.isArray(response) ? response.join(',') : response

const writeAttempt = async (
  db: PrismaClient,
  params: {
    runId: string
    questionId: string
    isCorrect: boolean
    response: string | null
    selfGraded: boolean
  }
) => {
  const progress = await db.questionProgress.findUnique({
    where: { questionId: params.questionId },
    select: { state: true, correctStreak: true }
  })
  const next = nextMastery(progress, params.isCorrect)
  const lastSeenAt = new Date()

  await db
    .$transaction([
      db.attempt.create({
        data: {
          id: attemptIdFor(params.runId, params.questionId),
          runId: params.runId,
          questionId: params.questionId,
          isCorrect: params.isCorrect,
          response: params.response,
          selfGraded: params.selfGraded
        }
      }),
      db.questionProgress.upsert({
        where: { questionId: params.questionId },
        create: {
          questionId: params.questionId,
          state: next.state,
          correctStreak: next.correctStreak,
          timesSeen: 1,
          timesCorrect: params.isCorrect ? 1 : 0,
          lastSeenAt
        },
        update: {
          state: next.state,
          correctStreak: next.correctStreak,
          timesSeen: { increment: 1 },
          timesCorrect: { increment: params.isCorrect ? 1 : 0 },
          lastSeenAt
        }
      })
    ])
    .catch((error: unknown) => {
      if (isUniqueViolation(error))
        throw new AppError(
          'BAD_REQUEST',
          'This question was already answered in this run'
        )
      throw error
    })
}

const requireRunQuestion = async (
  db: PrismaClient,
  runId: string,
  questionId: string
) => {
  const run = await db.drillRun.findUnique({
    where: { id: runId },
    select: { questionIds: true }
  })
  if (!run) throw new AppError('NOT_FOUND', 'Run not found')
  if (!run.questionIds.includes(questionId))
    throw new AppError('BAD_REQUEST', 'Question is not part of this run')
}

const runSubmitAnswer = async ({
  runId,
  questionId,
  response
}: SubmitAnswerInput & { runId: string }) => {
  const db = await getPrismaClient()
  await requireRunQuestion(db, runId, questionId)

  const question = await db.question.findUnique({
    where: { id: questionId },
    select: {
      type: true,
      correctLetters: true,
      acceptedAnswers: true,
      answerDisplay: true,
      explanation: true
    }
  })
  if (!question) throw new AppError('NOT_FOUND', 'Question not found')

  const verdict: Verdict = grade(question, response)
  const reveal = {
    verdict,
    correctLetters: question.correctLetters,
    answerDisplay: question.answerDisplay,
    explanation: question.explanation
  }

  // The single most important contract in this issue: nothing below this
  // line may touch the database when the verdict is 'no-match'.
  if (verdict === 'no-match') return reveal

  await writeAttempt(db, {
    runId,
    questionId,
    isCorrect: verdict === 'matched',
    response: toResponseText(response),
    selfGraded: false
  })

  return reveal
}

export const submitAnswer = (input: SubmitAnswerInput & { runId: string }) =>
  catchAsyncError(runSubmitAnswer(input))

const runSelfGrade = async ({
  runId,
  questionId,
  hadIt
}: SelfGradeInput & { runId: string }) => {
  const db = await getPrismaClient()
  await requireRunQuestion(db, runId, questionId)

  const question = await db.question.findUnique({
    where: { id: questionId },
    select: { type: true }
  })
  if (!question) throw new AppError('NOT_FOUND', 'Question not found')
  // Only a fill-in can produce 'no-match', the only outcome self-grade resolves.
  if (question.type !== 'FILL_IN')
    throw new AppError(
      'BAD_REQUEST',
      'Only a fill-in answer can be self-graded'
    )

  await writeAttempt(db, {
    runId,
    questionId,
    isCorrect: hadIt,
    response: null,
    selfGraded: true
  })

  return { verdict: (hadIt ? 'matched' : 'wrong') as Verdict, selfGraded: true }
}

export const selfGrade = (input: SelfGradeInput & { runId: string }) =>
  catchAsyncError(runSelfGrade(input))

const runFinishRun = async (id: string) => {
  const db = await getPrismaClient()
  // A single conditional statement — the second call matches zero rows and
  // is a genuine no-op, with no read-then-write window.
  await db.drillRun.updateMany({
    where: { id, finishedAt: null },
    data: { finishedAt: new Date() }
  })

  const run = await db.drillRun.findUnique({
    where: { id },
    select: { id: true, finishedAt: true, questionIds: true }
  })
  if (!run) throw new AppError('NOT_FOUND', 'Run not found')

  const score = await db.attempt.count({
    where: { runId: id, isCorrect: true }
  })

  return {
    id: run.id,
    finishedAt: run.finishedAt,
    score,
    total: run.questionIds.length
  }
}

export const finishRun = (id: string) => catchAsyncError(runFinishRun(id))

type RunHistoryScope = Pick<
  StartRunInput,
  'scopeKind' | 'scopeValue' | 'certSlug'
>

const runGetRunHistory = async ({
  scopeKind,
  scopeValue,
  certSlug
}: RunHistoryScope) => {
  const db = await getPrismaClient()

  const runs = await db.drillRun.findMany({
    where: { scopeKind, scopeValue },
    orderBy: { startedAt: 'desc' },
    take: RUN_HISTORY_LIMIT,
    select: { id: true, startedAt: true, finishedAt: true, questionIds: true }
  })

  // DrillRun has no certSlug column; each run's first question id witnesses its cert.
  const witnessIds = runs
    .map((run) => run.questionIds[0])
    .filter((questionId) => questionId !== undefined)

  const inCert = new Set(
    (
      await db.question.findMany({
        where: {
          id: { in: witnessIds },
          exam: { certification: { slug: certSlug } }
        },
        select: { id: true }
      })
    ).map((question) => question.id)
  )

  const scoped = runs.filter((run) => {
    const witness = run.questionIds[0]
    return witness !== undefined && inCert.has(witness)
  })

  const counts = await db.attempt.groupBy({
    by: ['runId'],
    where: { runId: { in: scoped.map((run) => run.id) }, isCorrect: true },
    _count: { _all: true }
  })
  const scoreByRun = new Map<string | null, number>(
    counts.map((row) => [row.runId, row._count._all])
  )

  return scoped.map((run) => ({
    id: run.id,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    score: scoreByRun.get(run.id) ?? 0,
    total: run.questionIds.length
  }))
}

export const getRunHistory = (scope: RunHistoryScope) =>
  catchAsyncError(runGetRunHistory(scope))
