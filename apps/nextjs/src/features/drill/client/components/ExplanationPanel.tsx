import { PromptMarkdown } from './PromptMarkdown'

interface ExplanationPanelProps {
  explanation: string
}

function ExplanationPanel({ explanation }: Readonly<ExplanationPanelProps>) {
  return (
    <section
      aria-label="Explanation"
      className="bg-muted text-prose-foreground [&_code]:bg-secondary mt-6 max-w-[70ch] rounded-md px-5 py-[18px] text-sm leading-[1.65]"
      data-slot="explanation-panel"
    >
      <PromptMarkdown text={explanation} />
    </section>
  )
}

export { ExplanationPanel }
