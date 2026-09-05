import { PromptMarkdown } from './PromptMarkdown'

interface ExplanationPanelProps {
  explanation: string
}

function ExplanationPanel({ explanation }: Readonly<ExplanationPanelProps>) {
  return (
    <section
      aria-label="Explanation"
      className="bg-muted/70 mt-6 max-w-[70ch] rounded-lg p-4 text-sm leading-relaxed"
      data-slot="explanation-panel"
    >
      <PromptMarkdown text={explanation} />
    </section>
  )
}

export { ExplanationPanel }
