import 'server-only'
import { RUN_HISTORY_LIMIT } from '@/features/drill/constants'
import { grade, type Verdict } from '@/features/drill/lib/grade'
import { nextMastery } from '@/features/drill/lib/mastery'
import { buildScopeWhere, orderQueue } from '@/features/drill/lib/queue'
import {
  type AttemptOutcome,
  summarizeOutcomes
} from '@/features/drill/lib/summary'
import type { SelfGradeInput } from '@/features/drill/schemas/selfGrade.schema'
import type { StartRunInput } from '@/features/drill/schemas/startRun.schema'
import type { SubmitAnswerInput } from '@/features/drill/schemas/submitAnswer.schema'
import { AppError } from '@/features/error/lib/AppError'
import { catchAsyncError } from '@/features/error/utils/catchError'
import {
  type PrismaClient,
  type ScopeKind,
  getPrismaClient
} from '@/lib/prisma'

const runStartRun = async (input: StartRunInput) => {
  const db = await getPrismaClient()
  const where = buildScopeWhere(input)

  const candidates = await db.question.findMany({
    where,
    select: { id: true, progress: { select: { state: true } } },
    orderBy: [{ exam: { code: 'asc' } }, { number: 'asc' }]
  })

  const questionIds = orderQueue(candidates, input.limit ?? candidates.length)

  if (questionIds.length === 0)
    throw new AppError('NOT_FOUND', 'No questions match this scope')

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

const runStartOrResumeRun = async (
  input: StartRunInput
): Promise<{ id: string }> => {
  const db = await getPrismaClient()

  const resumable = await db.drillRun.findFirst({
    where: {
      scopeKind: input.scopeKind,
      scopeValue: input.scopeValue,
      finishedAt: null,
      attempts: { some: {} }
    },

    orderBy: [{ attempts: { _count: 'desc' } }, { startedAt: 'desc' }],
    select: { id: true }
  })

  return resumable ?? runStartRun(input)
}

export const startOrResumeRun = (input: StartRunInput) =>
  catchAsyncError(runStartOrResumeRun(input))

const runGetRun = async (id: string) => {
  const db = await getPrismaClient()
  const run = await db.drillRun.findUnique({ where: { id } })
  if (!run) throw new AppError('NOT_FOUND', 'Run not found')

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
      progress: { select: { timesSeen: true } },
      bookmark: { select: { questionId: true } }
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

const closeRunIfOpen = (db: PrismaClient, id: string) =>
  db.drillRun.updateMany({
    where: { id, finishedAt: null },
    data: { finishedAt: new Date() }
  })

const runFinishRun = async (id: string) => {
  const db = await getPrismaClient()
  await closeRunIfOpen(db, id)

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

export interface CertificationRun {
  id: string
  scopeKind: ScopeKind
  scopeValue: string
  startedAt: Date
  finishedAt: Date | null
  score: number
  total: number
}

const runGetCertificationRunHistory = async (
  certSlug: string
): Promise<CertificationRun[]> => {
  const db = await getPrismaClient()

  const certQuestions = await db.question.findMany({
    where: { exam: { certification: { slug: certSlug } } },
    select: { id: true }
  })
  const certQuestionIds = certQuestions.map((question) => question.id)

  if (certQuestionIds.length === 0) return []

  const runs = await db.drillRun.findMany({
    where: { questionIds: { hasSome: certQuestionIds } },
    orderBy: { startedAt: 'desc' },
    take: RUN_HISTORY_LIMIT,
    select: {
      id: true,
      scopeKind: true,
      scopeValue: true,
      startedAt: true,
      finishedAt: true,
      questionIds: true
    }
  })

  const counts = await db.attempt.groupBy({
    by: ['runId'],
    where: { runId: { in: runs.map((run) => run.id) }, isCorrect: true },
    _count: { _all: true }
  })
  const scoreByRun = new Map<string | null, number>(
    counts.map((row) => [row.runId, row._count._all])
  )

  return runs.map((run) => ({
    id: run.id,
    scopeKind: run.scopeKind,
    scopeValue: run.scopeValue,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    score: scoreByRun.get(run.id) ?? 0,
    total: run.questionIds.length
  }))
}

export const getCertificationRunHistory = (certSlug: string) =>
  catchAsyncError(runGetCertificationRunHistory(certSlug))

const runGetRunSummary = async ({
  runId,
  certSlug
}: {
  runId: string
  certSlug: string
}) => {
  const db = await getPrismaClient()

  await closeRunIfOpen(db, runId)

  const run = await db.drillRun.findUnique({
    where: { id: runId },
    select: {
      id: true,
      scopeKind: true,
      scopeValue: true,
      questionIds: true,
      startedAt: true,
      finishedAt: true
    }
  })
  if (!run) throw new AppError('NOT_FOUND', 'Run not found')

  const witnessId = run.questionIds[0]
  const witness = witnessId
    ? await db.question.findFirst({
        where: { id: witnessId, exam: { certification: { slug: certSlug } } },
        select: { id: true }
      })
    : null
  if (!witness) throw new AppError('NOT_FOUND', 'Run not found')

  const attempts = await db.attempt.findMany({
    where: { runId },
    select: {
      questionId: true,
      isCorrect: true,
      selfGraded: true,
      response: true
    }
  })

  const outcomes = summarizeOutcomes(
    run.questionIds,
    attempts satisfies AttemptOutcome[]
  )

  const missedIds = attempts
    .filter((attempt) => !attempt.isCorrect)
    .map((attempt) => attempt.questionId)
  const responseByQuestionId = new Map(
    attempts.map((attempt) => [attempt.questionId, attempt.response])
  )

  const missedQuestions = await db.question.findMany({
    where: { id: { in: missedIds } },
    select: {
      id: true,
      number: true,
      objective: true,
      prompt: true,
      type: true,
      correctLetters: true,
      answerDisplay: true,
      explanation: true,
      options: {
        select: { letter: true, text: true },
        orderBy: { letter: 'asc' }
      }
    }
  })
  const missedById = new Map(
    missedQuestions.map((question) => [question.id, question])
  )
  const misses = missedIds
    .map((questionId) => {
      const question = missedById.get(questionId)
      if (!question) return null
      return {
        ...question,
        response: responseByQuestionId.get(questionId) ?? null
      }
    })
    .filter((miss) => miss !== null)

    .sort(
      (a, b) => run.questionIds.indexOf(a.id) - run.questionIds.indexOf(b.id)
    )

  const answeredIds = new Set(attempts.map((attempt) => attempt.questionId))
  const skippedIds = run.questionIds.filter(
    (questionId) => !answeredIds.has(questionId)
  )

  const skippedQuestions = await db.question.findMany({
    where: { id: { in: skippedIds } },
    select: { id: true, objective: true, prompt: true }
  })
  const skippedById = new Map(
    skippedQuestions.map((question) => [question.id, question])
  )
  const positionOf = new Map(
    run.questionIds.map((questionId, index) => [questionId, index + 1])
  )
  const skipped = skippedIds.flatMap((questionId) => {
    const question = skippedById.get(questionId)
    return question
      ? [{ ...question, position: positionOf.get(questionId) ?? 0 }]
      : []
  })

  return {
    run: {
      id: run.id,
      scopeKind: run.scopeKind,
      scopeValue: run.scopeValue,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt
    },
    outcomes,
    misses,
    skipped
  }
}

export const getRunSummary = (input: { runId: string; certSlug: string }) =>
  catchAsyncError(runGetRunSummary(input))

const runRetryRun = async (id: string) => {
  const db = await getPrismaClient()
  const source = await db.drillRun.findUnique({
    where: { id },
    select: { scopeKind: true, scopeValue: true, questionIds: true }
  })
  if (!source) throw new AppError('NOT_FOUND', 'Run not found')

  return db.drillRun.create({
    data: {
      scopeKind: source.scopeKind,
      scopeValue: source.scopeValue,
      questionIds: source.questionIds
    },
    select: { id: true, questionIds: true, startedAt: true }
  })
}

export const retryRun = (id: string) => catchAsyncError(runRetryRun(id))
