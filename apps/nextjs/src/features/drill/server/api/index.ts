import 'server-only'
import { RUN_HISTORY_LIMIT } from '@/features/drill/constants'
import { grade, type Verdict } from '@/features/drill/lib/grade'
import { nextMastery } from '@/features/drill/lib/mastery'
import { orderByIds } from '@/features/drill/lib/orderByIds'
import { buildScopeWhere, orderQueue } from '@/features/drill/lib/queue'
import {
  type AttemptOutcome,
  summarizeOutcomes
} from '@/features/drill/lib/summary'
import type { SelfGradeInput } from '@/features/drill/schemas/selfGrade.schema'
import type { StartRunInput } from '@/features/drill/schemas/startRun.schema'
import type { SubmitAnswerInput } from '@/features/drill/schemas/submitAnswer.schema'
import { AppError } from '@/features/error/lib/AppError'
import { prisma, type ScopeKind } from '@/lib/prisma'

const runHeaderSelect = {
  id: true,
  scopeKind: true,
  scopeValue: true,
  startedAt: true,
  finishedAt: true
} as const

export const startRun = async (input: StartRunInput) => {
  const candidates = await prisma.question.findMany({
    where: buildScopeWhere(input),
    select: { id: true, progress: { select: { state: true } } },
    orderBy: [{ exam: { code: 'asc' } }, { number: 'asc' }]
  })

  const questionIds = orderQueue(candidates, input.limit ?? candidates.length)

  if (questionIds.length === 0)
    throw new AppError('NOT_FOUND', 'No questions match this scope')

  return prisma.drillRun.create({
    data: {
      scopeKind: input.scopeKind,
      scopeValue: input.scopeValue,
      questionIds,
      certification: { connect: { slug: input.certSlug } }
    },
    select: { id: true }
  })
}

export const startOrResumeRun = async (
  input: StartRunInput
): Promise<{ id: string }> => {
  const resumable = await prisma.drillRun.findFirst({
    where: {
      scopeKind: input.scopeKind,
      scopeValue: input.scopeValue,
      certification: { slug: input.certSlug },
      finishedAt: null,
      attempts: { some: {} }
    },
    orderBy: [{ attempts: { _count: 'desc' } }, { startedAt: 'desc' }],
    select: { id: true }
  })

  return resumable ?? startRun(input)
}

export const getRun = async (id: string) => {
  const run = await prisma.drillRun.findUnique({
    where: { id },
    select: { ...runHeaderSelect, questionIds: true }
  })
  if (!run) throw new AppError('NOT_FOUND', 'Run not found')

  const [questions, answered] = await Promise.all([
    prisma.question.findMany({
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
    }),
    prisma.attempt.findMany({
      where: { runId: id },
      select: { questionId: true }
    })
  ])

  const { questionIds, ...header } = run
  return {
    run: header,
    questions: orderByIds(questionIds, questions),
    answeredQuestionIds: answered.map((attempt) => attempt.questionId)
  }
}

const isUniqueViolation = (error: unknown) =>
  error instanceof Error && 'code' in error && error.code === 'P2002'

const toResponseText = (response: string | string[]) =>
  Array.isArray(response) ? response.join(',') : response

const writeAttempt = async (params: {
  runId: string
  questionId: string
  isCorrect: boolean
  response: string | null
  selfGraded: boolean
}) => {
  const progress = await prisma.questionProgress.findUnique({
    where: { questionId: params.questionId },
    select: { state: true, correctStreak: true }
  })
  const next = nextMastery(progress, params.isCorrect)
  const lastSeenAt = new Date()

  await prisma
    .$transaction([
      prisma.attempt.create({
        data: {
          id: `${params.runId}:${params.questionId}`,
          runId: params.runId,
          questionId: params.questionId,
          isCorrect: params.isCorrect,
          response: params.response,
          selfGraded: params.selfGraded
        }
      }),
      prisma.questionProgress.upsert({
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

const requireRunQuestion = async (runId: string, questionId: string) => {
  const run = await prisma.drillRun.findUnique({
    where: { id: runId },
    select: { questionIds: true }
  })
  if (!run) throw new AppError('NOT_FOUND', 'Run not found')
  if (!run.questionIds.includes(questionId))
    throw new AppError('BAD_REQUEST', 'Question is not part of this run')
}

export const submitAnswer = async ({
  runId,
  questionId,
  response
}: SubmitAnswerInput & { runId: string }) => {
  await requireRunQuestion(runId, questionId)

  const question = await prisma.question.findUnique({
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

  await writeAttempt({
    runId,
    questionId,
    isCorrect: verdict === 'matched',
    response: toResponseText(response),
    selfGraded: false
  })

  return reveal
}

export const selfGrade = async ({
  runId,
  questionId,
  hadIt
}: SelfGradeInput & { runId: string }) => {
  await requireRunQuestion(runId, questionId)

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { type: true }
  })
  if (!question) throw new AppError('NOT_FOUND', 'Question not found')

  if (question.type !== 'FILL_IN')
    throw new AppError(
      'BAD_REQUEST',
      'Only a fill-in answer can be self-graded'
    )

  await writeAttempt({
    runId,
    questionId,
    isCorrect: hadIt,
    response: null,
    selfGraded: true
  })

  return { verdict: (hadIt ? 'matched' : 'wrong') as Verdict, selfGraded: true }
}

export interface RunHistoryEntry {
  id: string
  scopeKind: ScopeKind
  scopeValue: string
  startedAt: Date
  finishedAt: Date | null
  score: number
  total: number
}

// Without a scope, lists every run in the certification.
export const getRunHistory = async ({
  certSlug,
  scope
}: {
  certSlug: string
  scope?: Pick<StartRunInput, 'scopeKind' | 'scopeValue'>
}): Promise<RunHistoryEntry[]> => {
  const runs = await prisma.drillRun.findMany({
    where: { certification: { slug: certSlug }, ...scope },
    orderBy: { startedAt: 'desc' },
    take: RUN_HISTORY_LIMIT,
    select: { ...runHeaderSelect, questionIds: true }
  })

  const counts = await prisma.attempt.groupBy({
    by: ['runId'],
    where: { runId: { in: runs.map((run) => run.id) }, isCorrect: true },
    _count: { _all: true }
  })
  const scoreByRun = new Map(counts.map((row) => [row.runId, row._count._all]))

  return runs.map(({ questionIds, ...run }) => ({
    ...run,
    score: scoreByRun.get(run.id) ?? 0,
    total: questionIds.length
  }))
}

export const getRunSummary = async ({
  runId,
  certSlug
}: {
  runId: string
  certSlug: string
}) => {
  const inCert = { id: runId, certification: { slug: certSlug } }

  await prisma.drillRun.updateMany({
    where: { ...inCert, finishedAt: null },
    data: { finishedAt: new Date() }
  })

  const run = await prisma.drillRun.findFirst({
    where: inCert,
    select: { ...runHeaderSelect, questionIds: true }
  })
  if (!run) throw new AppError('NOT_FOUND', 'Run not found')

  const attempts = await prisma.attempt.findMany({
    where: { runId },
    select: {
      questionId: true,
      isCorrect: true,
      selfGraded: true,
      response: true
    }
  })

  const responseByQuestionId = new Map(
    attempts.map((attempt) => [attempt.questionId, attempt.response])
  )
  const missedIds = attempts
    .filter((attempt) => !attempt.isCorrect)
    .map((attempt) => attempt.questionId)
  const skippedIds = run.questionIds.filter(
    (questionId) => !responseByQuestionId.has(questionId)
  )

  const [missedQuestions, skippedQuestions] = await Promise.all([
    prisma.question.findMany({
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
        },
        exam: { select: { code: true } }
      }
    }),
    prisma.question.findMany({
      where: { id: { in: skippedIds } },
      select: { id: true, objective: true, prompt: true }
    })
  ])

  const { questionIds, ...header } = run
  return {
    run: header,
    outcomes: summarizeOutcomes(
      questionIds,
      attempts satisfies AttemptOutcome[]
    ),
    misses: orderByIds(questionIds, missedQuestions).map((question) => ({
      ...question,
      response: responseByQuestionId.get(question.id) ?? null
    })),
    skipped: orderByIds(questionIds, skippedQuestions).map((question) => ({
      ...question,
      position: questionIds.indexOf(question.id) + 1
    }))
  }
}

export const retryRun = async (id: string) => {
  const source = await prisma.drillRun.findUnique({
    where: { id },
    select: {
      scopeKind: true,
      scopeValue: true,
      questionIds: true,
      certificationId: true
    }
  })
  if (!source) throw new AppError('NOT_FOUND', 'Run not found')

  return prisma.drillRun.create({ data: source, select: { id: true } })
}

// Answers and mastery outlive the run: Attempt.runId is SetNull on delete.
export const deleteRun = async (id: string) => {
  const { count } = await prisma.drillRun.deleteMany({ where: { id } })
  if (count === 0) throw new AppError('NOT_FOUND', 'Run not found')
}
