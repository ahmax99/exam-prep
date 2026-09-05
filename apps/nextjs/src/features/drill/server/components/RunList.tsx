import Link from 'next/link'

import { describeScope, toPercent } from '@/features/drill/lib/summary'
import type { CertificationRun } from '@/features/drill/server/api'

interface RunListProps {
  certSlug: string
  runs: CertificationRun[]
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short'
})

function RunList({ certSlug, runs }: Readonly<RunListProps>) {
  return (
    <section data-slot="run-list">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-muted-foreground text-xs">
              <th className="py-2 font-normal">Started</th>
              <th className="py-2 font-normal">Scope</th>
              <th className="py-2 font-normal">Score</th>
              <th className="py-2 font-normal">%</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => {
              const formatted = dateFormatter.format(run.startedAt)
              const isOpen = run.finishedAt === null

              const href = isOpen
                ? `/${certSlug}/drill/${run.id}`
                : `/${certSlug}/drill/${run.id}/summary`
              const ariaLabel = isOpen
                ? `Resume run started ${formatted}`
                : `Summary for run started ${formatted}`

              return (
                <tr key={run.id}>
                  <td className="py-2 font-mono text-sm">
                    <Link aria-label={ariaLabel} href={href}>
                      {formatted}
                    </Link>
                    {isOpen && (
                      <span className="text-muted-foreground ml-2 text-xs">
                        in progress
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-sm">
                    {describeScope(run.scopeKind, run.scopeValue)}
                  </td>
                  <td className="py-2 font-mono text-sm">
                    {run.score} / {run.total}
                  </td>
                  <td className="py-2 font-mono text-sm">
                    {toPercent(run.score, run.total)}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export { RunList }
