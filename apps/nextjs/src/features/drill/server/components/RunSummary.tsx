import type { RunOutcomes } from '@/features/drill/lib/summary'

interface RunSummaryProps {
  headline: string
  outcomes: RunOutcomes
}

function RunSummary({ headline, outcomes }: Readonly<RunSummaryProps>) {
  return (
    <section data-slot="run-summary">
      <p className="text-xl leading-snug font-medium text-balance">
        {headline}
      </p>
      <p className="text-muted-foreground mt-1 font-mono text-sm">
        {outcomes.score} / {outcomes.total} · {outcomes.percent}%
      </p>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-muted-foreground text-xs">Correct</p>
          <p className="font-mono">{outcomes.rightFirstTry}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Self-graded</p>
          <p className="font-mono">{outcomes.selfGraded}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Missed</p>
          <p className="font-mono">{outcomes.missed}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Skipped</p>
          <p className="font-mono">{outcomes.skipped}</p>
        </div>
      </div>
    </section>
  )
}

export { RunSummary }
