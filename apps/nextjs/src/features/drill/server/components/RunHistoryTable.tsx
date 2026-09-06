import { runDateFormatter, type HistoryRow } from '@/features/drill/lib/summary'
import { cn } from '@/utils/mergeClass'

import { historyDeltaVariants } from './RunHistoryTable.variants'

interface RunHistoryTableProps {
  rows: HistoryRow[]
}

const deltaText = (delta: HistoryRow['delta']) => {
  if (!delta) return '—'
  if (delta.direction === 'even') return 'No change'
  return delta.direction === 'up'
    ? `+${delta.points} pts`
    : `−${Math.abs(delta.points)} pts`
}

function RunHistoryTable({ rows }: Readonly<RunHistoryTableProps>) {
  return (
    <section
      className="border-border bg-card overflow-hidden rounded-lg border"
      data-slot="run-history-table"
    >
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[520px] text-left">
          <thead>
            <tr className="bg-table-header text-muted-foreground border-border border-b font-mono text-[9px] font-medium tracking-widest uppercase">
              <th className="h-[38px] pl-[22px] font-medium">Started</th>
              <th className="h-[38px] w-[110px] font-medium">Score</th>
              <th className="h-[38px] w-[70px] font-medium">%</th>
              <th className="h-[38px] w-[110px] pr-[22px] text-right font-medium">
                Change
              </th>
            </tr>
          </thead>
          <tbody className="font-mono text-[11px] tracking-[-0.04em]">
            {rows.map((row, index) => (
              <tr
                key={row.id}
                aria-current={row.isCurrent ? 'true' : undefined}
                className={cn(
                  index > 0 && 'border-row-border border-t',
                  row.isCurrent && 'bg-row-active'
                )}
              >
                <td className="h-[46px] pl-[22px]">
                  {runDateFormatter.format(row.startedAt)}
                  {row.isCurrent && (
                    <span className="sr-only"> (current run)</span>
                  )}
                </td>
                <td className="h-[46px]">
                  {row.score} / {row.total}
                </td>
                <td className="h-[46px]">{row.percent}%</td>
                <td
                  aria-label={
                    row.delta === null ? 'no previous run' : undefined
                  }
                  className={cn(
                    'h-[46px] pr-[22px] text-right',
                    historyDeltaVariants({
                      direction: row.delta?.direction ?? 'none'
                    })
                  )}
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
