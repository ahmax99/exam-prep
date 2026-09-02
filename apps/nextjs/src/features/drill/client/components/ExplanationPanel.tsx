import { PromptMarkdown } from './PromptMarkdown'

interface ExplanationPanelProps {
  explanation: string
}

function ExplanationPanel({ explanation }: Readonly<ExplanationPanelProps>) {
  return (
    <section
      aria-label="Explanation"
      className="border-border bg-card mt-4 rounded-lg border p-4"
      data-slot="explanation-panel"
    >
      <PromptMarkdown text={explanation} />
    </section>
  )
}

export { ExplanationPanel }
