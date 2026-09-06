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
      className="border-border bg-card mt-5 rounded-lg border px-7 py-[26px]"
      data-slot="skipped-review"
    >
      <h2 className="text-lg font-semibold tracking-tight">
        {skipped.length === 1
          ? '1 question you skipped'
          : `${skipped.length} questions you skipped`}
      </h2>
      <p className="text-muted-foreground mt-1.5 text-sm">
        Pick one to go back and answer it in this run.
      </p>

      <ol className="mt-4 flex flex-col gap-0.5">
        {skipped.map((question) => (
          <li key={question.id}>
            <Link
              className="hover:bg-muted -mx-3.5 flex min-h-11 flex-col justify-center gap-[5px] rounded-md px-3.5 py-3 transition-colors"
              href={`/${certSlug}/drill/${runId}?q=${question.id}`}
            >
              <span
                className="text-muted-foreground font-mono text-[10px]"
                data-numeric
              >
                {question.position} / {total} · {question.objective}
              </span>
              <span className="text-[15px] leading-[1.35]">
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
