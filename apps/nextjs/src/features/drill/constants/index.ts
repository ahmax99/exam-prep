import type { QuestionType } from '@/lib/prisma'

export const RUN_HISTORY_LIMIT = 50

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  SINGLE_ANSWER: 'Single answer',
  MULTIPLE_ANSWER: 'Multiple answer',
  FILL_IN: 'Fill in'
}
