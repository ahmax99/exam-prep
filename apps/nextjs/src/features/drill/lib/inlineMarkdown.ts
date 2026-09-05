interface InlineToken {
  kind: 'text' | 'code'
  value: string
  bold: boolean
}

const INLINE_PATTERN = /`([^`]*)`|\*\*([\s\S]+?)\*\*/g

const isCodeSpan = (segment: string) =>
  segment.length >= 2 && segment.startsWith('`') && segment.endsWith('`')

const toBoldTokens = (content: string): InlineToken[] =>
  content
    .split(/(`[^`]*`)/)
    .filter((segment) => segment.length > 0)
    .map((segment) =>
      isCodeSpan(segment)
        ? { kind: 'code', value: segment.slice(1, -1), bold: true }
        : { kind: 'text', value: segment, bold: true }
    )

const tokenizeInlineMarkdown = (text: string): InlineToken[] => {
  const tokens: InlineToken[] = []
  let cursor = 0

  for (const match of text.matchAll(INLINE_PATTERN)) {
    const [full, codeContent, boldContent] = match
    const start = match.index

    if (start > cursor) {
      tokens.push({
        kind: 'text',
        value: text.slice(cursor, start),
        bold: false
      })
    }

    if (codeContent !== undefined) {
      tokens.push({ kind: 'code', value: codeContent, bold: false })
    } else if (boldContent !== undefined) {
      tokens.push(...toBoldTokens(boldContent))
    }

    cursor = start + full.length
  }

  if (cursor < text.length) {
    tokens.push({ kind: 'text', value: text.slice(cursor), bold: false })
  }

  return tokens.filter((token) => token.value !== '')
}

const stripInlineMarkdown = (text: string): string =>
  tokenizeInlineMarkdown(text)
    .map((token) => token.value)
    .join('')

export { stripInlineMarkdown, tokenizeInlineMarkdown }
export type { InlineToken }
