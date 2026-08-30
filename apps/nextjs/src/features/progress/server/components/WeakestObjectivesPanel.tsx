import Link from 'next/link'

import { MasteryBar } from '@/components/atoms'
import type { WeakestObjective } from '@/features/progress/server/api'

interface WeakestObjectivesPanelProps {
  certSlug: string
  objectives: WeakestObjective[]
}

function WeakestObjectivesPanel({
  certSlug,
  objectives
}: Readonly<WeakestObjectivesPanelProps>) {
  return (
    <section
      aria-label="Weakest objectives"
      className="mt-8 flex flex-col gap-3"
      data-slot="weakest-objectives-panel"
    >
      <h2 className="text-lg font-semibold">Weakest objectives</h2>
      {objectives.length === 0 ? (
        <div className="border-border bg-card text-muted-foreground flex flex-col gap-3 rounded-lg border p-4">
          <p>Every objective is untouched.</p>
          <Link
            className="text-foreground min-h-11 w-fit content-center underline"
            href={`/${certSlug}/drill?scopeKind=CERT&scopeValue=${certSlug}`}
          >
            Start drilling
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {objectives.map((objective) => (
            <li key={objective.objective}>
              <Link
                className="border-border bg-card hover:border-foreground/30 flex min-h-11 items-center gap-4 rounded-lg border p-3"
                href={`/${certSlug}/drill?scopeKind=OBJECTIVE&scopeValue=${objective.objective}`}
              >
                <span className="w-20 shrink-0 font-mono text-sm">
                  {objective.objective}
                </span>
                <span className="text-muted-foreground flex-1 truncate text-sm">
                  {objective.topic}
                </span>
                <MasteryBar
                  className="w-24"
                  mastered={objective.mastered}
                  shaky={0}
                  total={objective.total}
                />
                <span className="w-12 shrink-0 text-right font-mono text-sm">
                  {objective.masteryPercent}%
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export { WeakestObjectivesPanel }
