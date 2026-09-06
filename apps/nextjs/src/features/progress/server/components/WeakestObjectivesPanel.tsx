import Link from 'next/link'

import { ArrowRight } from 'lucide-react'

import { Button, CategoryDot, Empty, MasteryBar } from '@/components/atoms'
import { drillHref } from '@/features/drill/lib/drillHref'
import type { WeakestObjective } from '@/features/progress/server/api'
import { categoryColors } from '@/utils/categoryColor'
import { cn } from '@/utils/mergeClass'

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
      className="mt-[52px]"
      data-slot="weakest-objectives-panel"
    >
      <h2 className="text-xl font-semibold tracking-tight">
        Weakest objectives
      </h2>

      {!hasAttempts || objectives.length === 0 ? (
        <div className="mt-3.5">
          <Empty
            description="Answer some questions and the objectives you keep missing will rank here, weakest first."
            label="Topic mastery"
            title="Nothing ranked yet"
          >
            <Button
              className="mt-5"
              render={
                <Link
                  href={drillHref(certSlug, {
                    scopeKind: 'CERT',
                    scopeValue: certSlug
                  })}
                />
              }
              variant="outline-brand"
            >
              Start drilling
              <ArrowRight />
            </Button>
          </Empty>
        </div>
      ) : (
        <div className="border-border bg-card mt-3.5 overflow-hidden rounded-lg border">
          <div className="bg-table-header text-muted-foreground border-border hidden h-10 items-center gap-[18px] border-b px-[22px] font-mono text-[9px] font-medium tracking-widest uppercase sm:flex">
            <span className="w-2" />
            <span className="w-14">Obj</span>
            <span className="flex-1">Topic</span>
            <span className="w-28">Mastery</span>
            <span className="w-12 text-right">Mastered</span>
          </div>

          {objectives.map((objective, index) => (
            <Link
              key={objective.objective}
              className={cn(
                'hover:bg-muted focus-visible:ring-ring/50 flex min-h-14 flex-wrap items-center gap-x-[18px] gap-y-2.5 px-[22px] py-3 transition-colors focus-visible:ring-[3px] focus-visible:outline-none sm:flex-nowrap sm:py-0',
                index > 0 && 'border-row-border border-t'
              )}
              href={drillHref(certSlug, {
                scopeKind: 'OBJECTIVE',
                scopeValue: objective.objective
              })}
            >
              <CategoryDot
                color={colors.get(objective.topic) ?? 'var(--category-1)'}
              />
              <span
                className="w-14 shrink-0 font-mono text-[11px] tracking-[-0.04em]"
                data-numeric
              >
                {objective.objective}
              </span>
              <span className="min-w-0 flex-1 truncate text-[15px]">
                {objective.topic}
              </span>
              {/* A single success segment: this table ranks how much of the
                  objective is mastered, so shaky is not part of the reading. */}
              <MasteryBar
                className="bg-row-border dark:bg-secondary order-last h-1.5 w-full sm:order-none sm:w-28"
                mastered={objective.mastered}
                shaky={0}
                total={objective.total}
              />
              <span
                className="w-12 shrink-0 text-right font-mono text-[11px] tracking-[-0.04em]"
                data-numeric
              >
                {objective.masteryPercent}%
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

export { WeakestObjectivesPanel }
