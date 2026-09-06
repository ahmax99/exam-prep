import { Fragment } from 'react'

import { tokenizeInlineMarkdown } from '@/features/drill/lib/inlineMarkdown'

interface PromptMarkdownProps {
  text: string
  className?: string
}

function PromptMarkdown({ text, className }: Readonly<PromptMarkdownProps>) {
  const tokens = tokenizeInlineMarkdown(text)

  return (
    <span className={className} data-slot="prompt-markdown">
      {tokens.map((token, index) => {
        const key = `${index}-${token.value}`
        const content =
          token.kind === 'code' ? (
            <code className="bg-muted rounded-[3px] px-[5px] py-0.5 font-mono text-[0.82em] tracking-[-0.04em]">
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
