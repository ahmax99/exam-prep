import Link from 'next/link'

import { Empty, MasteryBar } from '@/components/atoms'
import type { WeakestObjective } from '@/features/progress/server/api'

interface WeakestObjectivesPanelProps {
  certSlug: string
  objectives: WeakestObjective[]
  hasAttempts: boolean
}

function WeakestObjectivesPanel({
  certSlug,
  objectives,
  hasAttempts
}: Readonly<WeakestObjectivesPanelProps>) {
  return (
    <section
      aria-label="Weakest objectives"
      className="mt-12"
      data-slot="weakest-objectives-panel"
    >
      <div className="border-border flex items-baseline justify-between gap-4 border-b pb-2">
        <h2 className="text-xl leading-snug font-medium">Weakest objectives</h2>
        <p className="text-muted-foreground shrink-0 text-sm">Mastered</p>
      </div>

      {!hasAttempts || objectives.length === 0 ? (
        <div className="mt-4">
          <Empty
            description="Answer some questions and the objectives you keep missing will rank here, weakest first."
            title="Nothing ranked yet"
          >
            <Link
              className="text-foreground min-h-11 w-fit content-center underline underline-offset-4"
              href={`/${certSlug}/drill?scopeKind=CERT&scopeValue=${certSlug}`}
            >
              Start drilling
            </Link>
          </Empty>
        </div>
      ) : (
        <ul className="divide-border divide-y">
          {objectives.map((objective) => (
            <li key={objective.objective}>
              <Link
                className="hover:bg-muted/60 focus-visible:ring-ring/50 -mx-3 flex min-h-14 items-center gap-4 rounded-md px-3 transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
                href={`/${certSlug}/drill?scopeKind=OBJECTIVE&scopeValue=${objective.objective}`}
              >
                <span className="w-16 shrink-0 font-mono text-sm" data-numeric>
                  {objective.objective}
                </span>
                <span className="flex-1 truncate text-sm">
                  {objective.topic}
                </span>
                <MasteryBar
                  className="hidden w-28 sm:flex"
                  mastered={objective.mastered}
                  shaky={0}
                  total={objective.total}
                />
                <span
                  className="w-12 shrink-0 text-right font-mono text-sm"
                  data-numeric
                >
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
