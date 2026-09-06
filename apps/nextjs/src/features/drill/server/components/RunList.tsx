import Link from 'next/link'

import { describeScope, runDateFormatter } from '@/features/drill/lib/summary'
import type { CertificationRun } from '@/features/drill/server/api'
import { cn } from '@/utils/mergeClass'
import { toPercent } from '@/utils/toPercent'

interface RunListProps {
  certSlug: string
  runs: CertificationRun[]
}

function RunList({ certSlug, runs }: Readonly<RunListProps>) {
  return (
    <section
      className="border-border bg-card overflow-hidden rounded-lg border"
      data-slot="run-list"
    >
      <div className="w-full overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="bg-table-header text-muted-foreground border-border flex h-[38px] items-center border-b px-6 font-mono text-[9px] font-medium tracking-widest uppercase">
            <span className="w-[190px]">Started</span>
            <span className="flex-1">Scope</span>
            <span className="w-[100px]">Score</span>
            <span className="w-16 text-right">%</span>
          </div>

          {runs.map((run, index) => {
            const formatted = runDateFormatter.format(run.startedAt)
            const isOpen = run.finishedAt === null

            return (
              <Link
                key={run.id}
                aria-label={
                  isOpen
                    ? `Resume run started ${formatted}`
                    : `Summary for run started ${formatted}`
                }
                className={cn(
                  'hover:bg-muted flex min-h-[50px] items-center px-6 transition-colors',
                  index > 0 && 'border-row-border border-t',
                  /* An in-progress run links into the drill, not a summary,
                     so it is tinted and its percent cell says so. */
                  isOpen && 'bg-row-active hover:bg-row-active'
                )}
                href={
                  isOpen
                    ? `/${certSlug}/drill/${run.id}`
                    : `/${certSlug}/drill/${run.id}/summary`
                }
              >
                <span
                  className="w-[190px] font-mono text-[11px] tracking-[-0.04em]"
                  data-numeric
                >
                  {formatted}
                </span>
                <span className="flex-1 text-[15px]">
                  {describeScope(run.scopeKind, run.scopeValue)}
                </span>
                <span
                  className="w-[100px] font-mono text-[11px] tracking-[-0.04em]"
                  data-numeric
                >
                  {run.score} / {run.total}
                </span>
                <span
                  className={cn(
                    'w-16 text-right font-mono text-[11px] tracking-[-0.04em]',
                    isOpen && 'text-brand'
                  )}
                  data-numeric={isOpen ? undefined : true}
                >
                  {isOpen ? 'resume' : `${toPercent(run.score, run.total)}%`}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export { RunList }
