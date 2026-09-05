import type { QuestionType } from '@/lib/prisma'

import { normalizeAnswer } from './normalizeAnswer'

export type Verdict = 'matched' | 'wrong' | 'no-match'

export interface GradableQuestion {
  type: QuestionType
  correctLetters: string[]
  acceptedAnswers: string[]
}

const toLetterSet = (response: string | string[]) =>
  new Set(
    (Array.isArray(response) ? response : [response]).map((letter) =>
      letter.trim().toUpperCase()
    )
  )

const isSameSet = (a: Set<string>, b: Set<string>) =>
  a.size === b.size && [...a].every((value) => b.has(value))

export const grade = (
  question: GradableQuestion,
  response: string | string[]
): Verdict => {
  switch (question.type) {
    case 'SINGLE_ANSWER':
    case 'MULTIPLE_ANSWER': {
      const chosen = toLetterSet(response)
      const correct = toLetterSet(question.correctLetters)
      return isSameSet(chosen, correct) ? 'matched' : 'wrong'
    }
    case 'FILL_IN': {
      const typed = normalizeAnswer(
        Array.isArray(response) ? response.join(' ') : response
      )
      return question.acceptedAnswers.includes(typed) ? 'matched' : 'no-match'
    }
  }
}
