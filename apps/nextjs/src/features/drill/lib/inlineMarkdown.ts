interface InlineToken {
  kind: 'text' | 'code'
  value: string
  bold: boolean
}

// Code-span alternative first: at each scan position a `**` inside backticks
// is consumed as code before bold parsing ever sees it, giving code precedence.
const INLINE_PATTERN = /`([^`]*)`|\*\*([\s\S]+?)\*\*/g

const isCodeSpan = (segment: string) =>
  segment.length >= 2 && segment.startsWith('`') && segment.endsWith('`')

// Bold content is re-scanned for code spans only — never for further emphasis —
// so a bold run keeps a nested `<code>` without the tokenizer needing recursion.
const toBoldTokens = (content: string): InlineToken[] =>
  content
    .split(/(`[^`]*`)/)
    .filter((segment) => segment.length > 0)
    .map((segment) =>
      isCodeSpan(segment)
        ? { kind: 'code', value: segment.slice(1, -1), bold: true }
        : { kind: 'text', value: segment, bold: true }
    )

/**
 * Splits `text` into render-ready inline runs, recognizing exactly two
 * constructs: code spans (`` `…` ``) and strong emphasis (`**…**`). Runs are
 * returned in source order with delimiters already stripped from `value`, and
 * no token ever has an empty `value`. Unbalanced or malformed markers (a lone
 * `*`, unmatched `**`) fall through untouched as plain text — never dropped,
 * never thrown.
 */
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

export { tokenizeInlineMarkdown }
export type { InlineToken }
