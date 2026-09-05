import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { err, ok, okAsync, ResultAsync } from 'neverthrow'
import { z } from 'zod'

import {
  deriveAcceptedAnswers,
  normalizeAnswer
} from '@/features/drill/lib/normalizeAnswer'
import { AppError } from '@/features/error/lib/AppError'
import {
  catchAsyncError,
  catchSyncError
} from '@/features/error/utils/catchError'
import type { QuestionType } from '@/lib/prisma'

const optionSchema = z.object({
  letter: z.string().min(1),
  text: z.string().min(1)
})

const correctLettersSchema = z
  .union([z.string().min(1), z.array(z.string().min(1)).min(1)])
  .transform((correct) => (Array.isArray(correct) ? correct : [correct]))

const baseQuestionSchema = z.object({
  number: z.number().int(),
  exam: z.string().min(1),
  objective: z.string().min(1),
  topic: z.string().min(1),
  question: z.string().min(1),
  explanation: z.string().min(1)
})

const questionSchema = z.discriminatedUnion('type', [
  baseQuestionSchema.extend({
    type: z.literal('single_answer'),
    options: z.array(optionSchema).min(1),
    correct: correctLettersSchema
  }),
  baseQuestionSchema.extend({
    type: z.literal('multiple_answer'),
    options: z.array(optionSchema).min(1),
    correct: correctLettersSchema
  }),
  baseQuestionSchema.extend({
    type: z.literal('fill_in'),
    answer: z
      .string()
      .min(1)
      .refine(
        (answer) => normalizeAnswer(answer).length > 0,
        'answer must contain more than backticks and whitespace'
      )
  })
])

const bankSchema = z.object({
  exam: z.string().min(1),
  title: z.string().min(1),
  questionCount: z.number().int().nonnegative().optional(),
  certification: z
    .object({
      slug: z.string().min(1),
      name: z.string().min(1),
      vendor: z.string().min(1)
    })
    .optional(),
  questions: z.array(questionSchema).min(1)
})

type Bank = z.infer<typeof bankSchema>
type BankQuestion = Bank['questions'][number]

const LPIC1_CERTIFICATION = {
  slug: 'lpic-1',
  name: 'LPIC-1: Linux Administrator',
  vendor: 'Linux Professional Institute'
} as const

const QUESTION_TYPE_BY_BANK_TYPE: Record<BankQuestion['type'], QuestionType> = {
  single_answer: 'SINGLE_ANSWER',
  multiple_answer: 'MULTIPLE_ANSWER',
  fill_in: 'FILL_IN'
}

const DEFAULT_INPUT_PATH = fileURLToPath(
  new URL('../../../data/lpic1', import.meta.url)
)

const expandPath = (resolved: string): ResultAsync<string[], AppError> =>
  catchAsyncError(stat(resolved)).andThen((stats) => {
    if (!stats.isDirectory()) return okAsync([resolved])

    return catchAsyncError(readdir(resolved)).map((entries) =>
      entries
        .filter((entry) => entry.endsWith('.json'))
        .sort()
        .map((entry) => path.join(resolved, entry))
    )
  })

const resolveInputFiles = (args: string[]): ResultAsync<string[], AppError> => {
  const resolved =
    args.length === 0
      ? [DEFAULT_INPUT_PATH]
      : args.map((arg) => path.resolve(process.cwd(), arg))

  return ResultAsync.combine(resolved.map(expandPath)).map((lists) =>
    lists.flat()
  )
}

const formatZodIssues = (file: string, issues: z.core.$ZodIssue[]) =>
  issues
    .map((issue) => `${file}: ${issue.path.join('.')} — ${issue.message}`)
    .join('\n')

const loadBank = (file: string): ResultAsync<Bank, AppError> =>
  catchAsyncError(readFile(file, 'utf8'))
    .andThen((text) => catchSyncError(() => JSON.parse(text) as unknown))
    .andThen((json) => {
      const parsed = bankSchema.safeParse(json)
      if (parsed.success) return ok(parsed.data)
      return err(
        new AppError('BAD_REQUEST', formatZodIssues(file, parsed.error.issues))
      )
    })

const loadPrismaClient = () =>
  import('@/lib/prisma').then((prismaModule) => prismaModule.getPrismaClient())

type Db = Awaited<ReturnType<typeof loadPrismaClient>>

const createEmptySummary = () => ({
  certificationsCreated: 0,
  certificationsUpdated: 0,
  examsCreated: 0,
  examsUpdated: 0,
  questionsCreated: 0,
  questionsUpdated: 0,
  optionsCreated: 0,
  optionsUpdated: 0,
  optionsDeleted: 0,
  fillInsWithMultipleAcceptedAnswers: 0
})

type Summary = ReturnType<typeof createEmptySummary>

const upsertCertification = async (
  db: Db,
  certification: { slug: string; name: string; vendor: string }
) => {
  const existing = await db.certification.findUnique({
    where: { slug: certification.slug }
  })
  const row = await db.certification.upsert({
    where: { slug: certification.slug },
    create: certification,
    update: certification
  })
  return { id: row.id, created: existing === null }
}

const upsertExam = async (
  db: Db,
  certificationId: string,
  code: string,
  title: string
) => {
  const where = { certificationId_code: { certificationId, code } }
  const existing = await db.exam.findUnique({ where })
  const row = await db.exam.upsert({
    where,
    create: { certificationId, code, title },
    update: { title }
  })
  return { id: row.id, created: existing === null }
}

const writeQuestions = async (
  db: Db,
  examId: string,
  questions: BankQuestion[],
  summary: Summary
) => {
  const existingNumbers = new Set(
    (
      await db.question.findMany({
        where: { examId },
        select: { number: true }
      })
    ).map((question) => question.number)
  )

  const questionRows: {
    id: string
    options: { letter: string; text: string }[]
  }[] = []

  for (const question of questions) {
    const created = !existingNumbers.has(question.number)
    const acceptedAnswers =
      question.type === 'fill_in' ? deriveAcceptedAnswers(question.answer) : []
    if (question.type === 'fill_in' && acceptedAnswers.length > 1)
      summary.fillInsWithMultipleAcceptedAnswers++

    const fields = {
      objective: question.objective,
      topic: question.topic,
      prompt: question.question,
      explanation: question.explanation,
      type: QUESTION_TYPE_BY_BANK_TYPE[question.type],
      correctLetters: question.type === 'fill_in' ? [] : question.correct,
      acceptedAnswers,
      answerDisplay: question.type === 'fill_in' ? question.answer : null
    }

    const row = await db.question.upsert({
      where: { examId_number: { examId, number: question.number } },
      create: { examId, number: question.number, ...fields },
      update: fields
    })

    if (created) summary.questionsCreated++
    else summary.questionsUpdated++

    questionRows.push({
      id: row.id,
      options: question.type === 'fill_in' ? [] : question.options
    })
  }

  return questionRows
}

const reconcileOptions = async (
  db: Db,
  questionRows: { id: string; options: { letter: string; text: string }[] }[],
  summary: Summary
) => {
  const existingOptions = await db.questionOption.findMany({
    where: { questionId: { in: questionRows.map((question) => question.id) } },
    select: { questionId: true, letter: true }
  })

  const existingLettersByQuestion = new Map<string, Set<string>>()
  for (const option of existingOptions) {
    const letters =
      existingLettersByQuestion.get(option.questionId) ?? new Set<string>()
    letters.add(option.letter)
    existingLettersByQuestion.set(option.questionId, letters)
  }

  for (const { id: questionId, options } of questionRows) {
    const existingLetters =
      existingLettersByQuestion.get(questionId) ?? new Set<string>()
    const incomingLetters = options.map((option) => option.letter)
    const incomingLetterSet = new Set(incomingLetters)

    summary.optionsCreated += options.filter(
      (option) => !existingLetters.has(option.letter)
    ).length
    summary.optionsUpdated += options.filter((option) =>
      existingLetters.has(option.letter)
    ).length
    summary.optionsDeleted += [...existingLetters].filter(
      (letter) => !incomingLetterSet.has(letter)
    ).length

    await db.$transaction([
      ...options.map((option) =>
        db.questionOption.upsert({
          where: { questionId_letter: { questionId, letter: option.letter } },
          create: { questionId, letter: option.letter, text: option.text },
          update: { text: option.text }
        })
      ),
      db.questionOption.deleteMany({
        where: { questionId, letter: { notIn: incomingLetters } }
      })
    ])
  }
}

const writeBank = async (db: Db, bank: Bank, summary: Summary) => {
  const certification = bank.certification ?? LPIC1_CERTIFICATION
  const certResult = await upsertCertification(db, certification)
  if (certResult.created) summary.certificationsCreated++
  else summary.certificationsUpdated++

  const examResult = await upsertExam(db, certResult.id, bank.exam, bank.title)
  if (examResult.created) summary.examsCreated++
  else summary.examsUpdated++

  const questionRows = await writeQuestions(
    db,
    examResult.id,
    bank.questions,
    summary
  )
  await reconcileOptions(db, questionRows, summary)
}

const writeBanks = async (banks: Bank[]): Promise<Summary> => {
  const db = await loadPrismaClient()
  const summary = createEmptySummary()
  for (const bank of banks) await writeBank(db, bank, summary)
  return summary
}

const main = (): ResultAsync<Summary, AppError> => {
  const args = process.argv.slice(2)
  return resolveInputFiles(args)
    .andThen((files) => ResultAsync.combine(files.map(loadBank)))
    .andThen((banks) => catchAsyncError(writeBanks(banks)))
}

const result = await main()
result.match(
  (summary) => {
    console.log(
      `certifications: ${summary.certificationsCreated} created, ${summary.certificationsUpdated} updated`
    )
    console.log(
      `exams: ${summary.examsCreated} created, ${summary.examsUpdated} updated`
    )
    console.log(
      `questions: ${summary.questionsCreated} created, ${summary.questionsUpdated} updated`
    )
    console.log(
      `options: ${summary.optionsCreated} created, ${summary.optionsUpdated} updated, ${summary.optionsDeleted} deleted`
    )
    console.log(
      `fill-ins with multiple accepted answers: ${summary.fillInsWithMultipleAcceptedAnswers}`
    )
  },
  (error) => {
    console.error(error.message)
    process.exitCode = 1
  }
)
