import { PromptMarkdown } from '@/features/drill/client/components/PromptMarkdown'
import { cn } from '@/utils/mergeClass'

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

interface AnswerRowProps {
  label: string
  tone: 'yours' | 'correct'
  children: React.ReactNode
}

const AnswerRow = ({ label, tone, children }: Readonly<AnswerRowProps>) => (
  <p className="flex items-baseline gap-2.5 text-sm">
    <span className="text-muted-foreground w-[104px] shrink-0">{label}</span>
    <code
      className={cn(
        'rounded-[3px] px-1.5 py-0.5 font-mono text-xs tracking-[-0.04em]',
        tone === 'yours'
          ? 'bg-destructive-tint text-destructive-ink'
          : 'bg-success-tint text-success-ink'
      )}
    >
      {children}
    </code>
  </p>
)

function MissReview({ misses }: Readonly<MissReviewProps>) {
  if (misses.length === 0) return null

  return (
    <section
      className="border-border bg-card mt-5 rounded-lg border px-7 py-[26px]"
      data-slot="miss-review"
    >
      <h2 className="text-lg font-semibold tracking-tight">
        {misses.length === 1
          ? '1 question to review'
          : `${misses.length} questions to review`}
      </h2>

      {misses.map((miss) => (
        <article
          key={miss.id}
          className="border-row-border mt-6 border-t pt-6 first-of-type:mt-5 first-of-type:border-0 first-of-type:pt-0"
        >
          <p className="max-w-[70ch] text-base leading-[1.55]">
            <PromptMarkdown text={miss.prompt} />
          </p>
          <div className="mt-3 flex flex-col gap-1.5">
            {miss.response === null ? (
              <p className="flex items-baseline gap-2.5 text-sm">
                <span className="text-muted-foreground w-[104px] shrink-0">
                  Your answer
                </span>
                <span className="text-muted-foreground">
                  no answer recorded
                </span>
              </p>
            ) : (
              <AnswerRow label="Your answer" tone="yours">
                {miss.response}
              </AnswerRow>
            )}
            <AnswerRow label="Correct answer" tone="correct">
              {miss.answerDisplay ?? miss.correctLetters.join(', ')}
            </AnswerRow>
          </div>
          <p className="bg-muted text-prose-foreground [&_code]:bg-secondary mt-3.5 max-w-[70ch] rounded-md px-4 py-3.5 text-sm leading-[1.65]">
            <PromptMarkdown text={miss.explanation} />
          </p>
        </article>
      ))}
    </section>
  )
}

export { MissReview }
