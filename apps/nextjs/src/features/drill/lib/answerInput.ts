import type { QuestionType } from '@/lib/prisma'

export const nextSelection = (
  type: QuestionType,
  selectedLetters: string[],
  letter: string
): string[] => {
  if (type === 'SINGLE_ANSWER') return [letter]
  return selectedLetters.includes(letter)
    ? selectedLetters.filter((selected) => selected !== letter)
    : [...selectedLetters, letter]
}

export const toAnswerResponse = (
  type: QuestionType,
  selectedLetters: string[],
  fillInValue: string
): string | string[] => {
  if (type === 'FILL_IN') return fillInValue
  if (type === 'SINGLE_ANSWER') return selectedLetters[0] ?? ''
  return selectedLetters
}

export const canSubmitAnswer = (
  type: QuestionType,
  selectedLetters: string[],
  fillInValue: string
): boolean =>
  type === 'FILL_IN' ? fillInValue.trim() !== '' : selectedLetters.length > 0

export const selectableLetters = (
  options: { letter: string }[] | undefined,
  isAnswered: boolean
): string[] =>
  isAnswered ? [] : (options?.map((option) => option.letter) ?? [])
