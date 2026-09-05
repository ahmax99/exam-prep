import Link from 'next/link'

import { CategoryDot, Empty, MasteryBar } from '@/components/atoms'
import { drillHref } from '@/features/drill/lib/drillHref'
import type { WeakestObjective } from '@/features/progress/server/api'
import { categoryColors } from '@/utils/categoryColor'

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
  const colors = categoryColors(objectives.map((objective) => objective.topic))

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
              href={drillHref(certSlug, {
                scopeKind: 'CERT',
                scopeValue: certSlug
              })}
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
                href={drillHref(certSlug, {
                  scopeKind: 'OBJECTIVE',
                  scopeValue: objective.objective
                })}
              >
                <CategoryDot
                  color={colors.get(objective.topic) ?? 'var(--category-1)'}
                />
                <span className="w-14 shrink-0 font-mono text-sm" data-numeric>
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
