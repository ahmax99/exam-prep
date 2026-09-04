import { PromptMarkdown } from './PromptMarkdown'

interface ExplanationPanelProps {
  explanation: string
}

function ExplanationPanel({ explanation }: Readonly<ExplanationPanelProps>) {
  return (
    // A recessed well, not a bordered card: the drill card is already `bg-card`,
    // so a second card on the same ground was a nested card drawn as a box.
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
