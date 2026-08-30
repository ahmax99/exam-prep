import { cn } from '@/utils/mergeClass'

interface PromptMarkdownProps {
  text: string
  className?: string
}

const isCodeSpan = (segment: string) =>
  segment.length >= 2 && segment.startsWith('`') && segment.endsWith('`')

function PromptMarkdown({ text, className }: Readonly<PromptMarkdownProps>) {
  const segments = text.split(/(`[^`]*`)/)

  return (
    <span className={cn(className)} data-slot="prompt-markdown">
      {segments.map((segment, index) =>
        isCodeSpan(segment) ? (
          <code
            key={index}
            className="bg-muted rounded px-1 py-0.5 font-mono text-[0.9em]"
          >
            {segment.slice(1, -1)}
          </code>
        ) : (
          segment
        )
      )}
    </span>
  )
}

export { PromptMarkdown }
