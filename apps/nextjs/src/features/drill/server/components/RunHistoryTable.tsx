import type { HistoryRow } from '@/features/drill/lib/summary'

import { historyDeltaVariants } from './RunHistoryTable.variants'

interface RunHistoryTableProps {
  rows: HistoryRow[]
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short'
})

const deltaText = (delta: HistoryRow['delta']) => {
  if (!delta) return '—'
  if (delta.direction === 'even') return 'No change'
  return delta.direction === 'up'
    ? `+${delta.points} pts`
    : `−${Math.abs(delta.points)} pts`
}

function RunHistoryTable({ rows }: Readonly<RunHistoryTableProps>) {
  return (
    <section data-slot="run-history-table">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-muted-foreground text-xs">
              <th className="py-2 font-normal">Started</th>
              <th className="py-2 font-normal">Score</th>
              <th className="py-2 font-normal">%</th>
              <th className="py-2 font-normal">Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                aria-current={row.isCurrent ? 'true' : undefined}
                className={row.isCurrent ? 'bg-muted' : undefined}
              >
                <td className="py-2 font-mono text-sm">
                  {dateFormatter.format(row.startedAt)}
                  {row.isCurrent && (
                    <span className="sr-only"> (current run)</span>
                  )}
                </td>
                <td className="py-2 font-mono text-sm">
                  {row.score} / {row.total}
                </td>
                <td className="py-2 font-mono text-sm">{row.percent}%</td>
                <td
                  aria-label={
                    row.delta === null ? 'no previous run' : undefined
                  }
                  className={historyDeltaVariants({
                    direction: row.delta?.direction ?? 'none'
                  })}
                >
                  {deltaText(row.delta)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export { RunHistoryTable }
