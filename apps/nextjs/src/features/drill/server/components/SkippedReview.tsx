import Link from 'next/link'

import { PromptMarkdown } from '@/features/drill/client/components/PromptMarkdown'

interface SkippedDetail {
  id: string
  objective: string
  prompt: string
  position: number
}

interface SkippedReviewProps {
  skipped: SkippedDetail[]
  certSlug: string
  runId: string
  total: number
}

function SkippedReview({
  skipped,
  certSlug,
  runId,
  total
}: Readonly<SkippedReviewProps>) {
  if (skipped.length === 0) return null

  return (
    <section
      className="border-border mt-6 rounded-lg border p-4"
      data-slot="skipped-review"
    >
      <h2 className="text-lg font-medium">
        {skipped.length === 1
          ? '1 question you skipped'
          : `${skipped.length} questions you skipped`}
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Pick one to go back and answer it in this run.
      </p>

      <ol className="mt-3 flex flex-col gap-1">
        {skipped.map((question) => (
          <li key={question.id}>
            <Link
              className="hover:bg-accent flex min-h-11 flex-col justify-center gap-1 rounded-lg p-3"
              href={`/${certSlug}/drill/${runId}?q=${question.id}`}
            >
              <span
                className="text-muted-foreground font-mono text-xs"
                data-numeric
              >
                {question.position} / {total} · {question.objective}
              </span>
              <span className="leading-snug">
                <PromptMarkdown text={question.prompt} />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}

export { SkippedReview }
