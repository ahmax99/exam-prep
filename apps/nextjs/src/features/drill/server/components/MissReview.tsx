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

// The highest-value content on this page — always rendered expanded, never
// behind a disclosure the user has to find.
function MissReview({ misses }: Readonly<MissReviewProps>) {
  if (misses.length === 0) return null

  return (
    <section
      className="border-border bg-card mt-6 rounded-lg border p-4"
      data-slot="miss-review"
    >
      <h2 className="text-lg font-medium">
        {misses.length === 1
          ? '1 question to review'
          : `${misses.length} questions to review`}
      </h2>

      {misses.map((miss) => (
        <article
          key={miss.id}
          className="border-border border-t pt-4 first-of-type:border-0 first-of-type:pt-0"
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
            {miss.answerDisplay ? (
              <PromptMarkdown text={miss.answerDisplay} />
            ) : (
              miss.correctLetters.join(', ')
            )}
          </p>
          <ExplanationPanel explanation={miss.explanation} />
        </article>
      ))}
    </section>
  )
}

export { MissReview }
