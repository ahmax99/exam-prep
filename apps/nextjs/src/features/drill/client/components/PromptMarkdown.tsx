import { Fragment } from 'react'

import { tokenizeInlineMarkdown } from '@/features/drill/lib/inlineMarkdown'
import { cn } from '@/utils/mergeClass'

interface PromptMarkdownProps {
  text: string
  className?: string
}

function PromptMarkdown({ text, className }: Readonly<PromptMarkdownProps>) {
  const tokens = tokenizeInlineMarkdown(text)

  return (
    <span className={cn(className)} data-slot="prompt-markdown">
      {tokens.map((token, index) => {
        const key = `${index}-${token.value}`
        const content =
          token.kind === 'code' ? (
            <code className="bg-muted rounded px-1 py-0.5 font-mono text-[0.9em]">
              {token.value}
            </code>
          ) : (
            token.value
          )

        return token.bold ? (
          <strong key={key} className="font-semibold">
            {content}
          </strong>
        ) : (
          <Fragment key={key}>{content}</Fragment>
        )
      })}
    </span>
  )
}

export { PromptMarkdown }
