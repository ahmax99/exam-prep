import { stripInlineMarkdown } from './inlineMarkdown'

const MAX_ANSWER_TOKENS = 4
const FORBIDDEN_SIDE_CHARS = /[\s,;'"]/

const WHITESPACE_RUN = /\s+/g

export const normalizeAnswer = (raw: string): string =>
  stripInlineMarkdown(raw).toLowerCase().replace(WHITESPACE_RUN, ' ').trim()

export const deriveAcceptedAnswers = (raw: string): string[] => {
  const normalized = normalizeAnswer(raw)

  if (normalized.split(' ').length > MAX_ANSWER_TOKENS) return [normalized]

  const sides = normalized.split(/ or | \/ /).map((side) => side.trim())

  if (sides.length < 2) return [normalized]

  const isValidSide = (side: string) =>
    side.length > 0 && !FORBIDDEN_SIDE_CHARS.test(side)

  if (!sides.every(isValidSide)) return [normalized]

  return [...new Set(sides)]
}
