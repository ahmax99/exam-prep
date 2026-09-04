import type { QuestionType } from '@/lib/prisma'

/**
 * The selection after toggling `letter`. A single-answer question replaces its
 * selection outright; a multi-answer one adds or removes, so the same click
 * both selects and deselects.
 */
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

/**
 * The payload `submitAnswer` sends for this question: the raw fill-in text, a
 * bare letter for single-answer, the whole set for multi-answer.
 *
 * The fill-in value is passed through untrimmed on purpose — normalizing an
 * answer is the grader's job on the server, never the client's.
 */
export const toAnswerResponse = (
  type: QuestionType,
  selectedLetters: string[],
  fillInValue: string
): string | string[] => {
  if (type === 'FILL_IN') return fillInValue
  if (type === 'SINGLE_ANSWER') return selectedLetters[0] ?? ''
  return selectedLetters
}

/** Whether this question has enough input to be submitted at all. */
export const canSubmitAnswer = (
  type: QuestionType,
  selectedLetters: string[],
  fillInValue: string
): boolean =>
  type === 'FILL_IN' ? fillInValue.trim() !== '' : selectedLetters.length > 0

/**
 * The option letters still selectable — every letter while the question is
 * open, none once it has been answered, and none when there is no question.
 *
 * The one expression both the key handler and the legend read, so a letter can
 * never be bound without being offered (or offered without being bound).
 */
export const selectableLetters = (
  options: { letter: string }[] | undefined,
  isAnswered: boolean
): string[] =>
  isAnswered ? [] : (options?.map((option) => option.letter) ?? [])
