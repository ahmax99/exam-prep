import { ExplanationPanel } from '@/features/drill/client/components/ExplanationPanel'
import { PromptMarkdown } from '@/features/drill/client/components/PromptMarkdown'

interface MissDetail {
  id: string
  prompt: string
  response: string | null
  correctLetters: string[]
  answerDisplay: string | null
  explanation: string
}

interface MissReviewProps {
  misses: MissDetail[]
}

// Native <details>/<summary> expands with zero JavaScript, so this stays a
// server component.
function MissReview({ misses }: Readonly<MissReviewProps>) {
  if (misses.length === 0) return null

  return (
    <details
      className="border-border bg-card mt-6 rounded-lg border p-4"
      data-slot="miss-review"
    >
      <summary className="min-h-11 cursor-pointer">
        Review {misses.length} {misses.length === 1 ? 'miss' : 'misses'}
      </summary>

      {misses.map((miss) => (
        <article
          key={miss.id}
          className="border-border border-t pt-4 first:border-0 first:pt-0"
        >
          <p className="my-2 text-base leading-relaxed">
            <PromptMarkdown text={miss.prompt} />
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Your answer: </span>
            {miss.response ?? 'no answer recorded'}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Correct answer: </span>
            {miss.answerDisplay ?? miss.correctLetters.join(', ')}
          </p>
          <ExplanationPanel explanation={miss.explanation} />
        </article>
      ))}
    </details>
  )
}

export { MissReview }
