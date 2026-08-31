import type { RunOutcomes } from '@/features/drill/lib/summary'

interface RunSummaryProps {
  outcomes: RunOutcomes
}

function RunSummary({ outcomes }: Readonly<RunSummaryProps>) {
  const allSkipped = outcomes.total === 0 || outcomes.skipped === outcomes.total

  return (
    <section
      className="flex flex-col md:flex-row md:items-baseline md:gap-6"
      data-slot="run-summary"
    >
      <div className="flex items-baseline gap-3">
        <p className="font-mono text-4xl">
          {outcomes.score} / {outcomes.total}
        </p>
        <p className="text-muted-foreground font-mono text-lg">
          {outcomes.percent}%
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 md:mt-0 md:grid-cols-4">
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

      {allSkipped && (
        <p className="text-muted-foreground mt-4 md:mt-0">
          Every question in this run was skipped.
        </p>
      )}
    </section>
  )
}

export { RunSummary }
