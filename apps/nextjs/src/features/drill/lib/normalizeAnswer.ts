const MAX_ANSWER_TOKENS = 4
const FORBIDDEN_SIDE_CHARS = /[\s,;'"]/

// ECMAScript's \s already covers the non-breaking space (U+00A0), which is
// what the real bank's NBSP-separated fill-in alternations depend on here.
const WHITESPACE_RUN = /\s+/g

export const normalizeAnswer = (raw: string): string =>
  raw.replaceAll('`', '').toLowerCase().replace(WHITESPACE_RUN, ' ').trim()

export const deriveAcceptedAnswers = (raw: string): string[] => {
  const normalized = normalizeAnswer(raw)

  if (normalized.split(' ').length > MAX_ANSWER_TOKENS) return [normalized]

  // Safe only because normalizeAnswer already collapsed every separator to a single space.
  const sides = normalized.split(/ or | \/ /).map((side) => side.trim())

  if (sides.length < 2) return [normalized]

  const isValidSide = (side: string) =>
    side.length > 0 && !FORBIDDEN_SIDE_CHARS.test(side)

  if (!sides.every(isValidSide)) return [normalized]

  return [...new Set(sides)]
}
