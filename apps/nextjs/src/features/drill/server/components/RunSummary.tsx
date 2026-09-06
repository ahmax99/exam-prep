import { MicroLabel } from '@/components/atoms'
import type { RunOutcomes } from '@/features/drill/lib/summary'

interface RunSummaryProps {
  headline: string
  outcomes: RunOutcomes
  children?: React.ReactNode
}

interface StatCell {
  label: string
  value: number
  dotClassName: string
}

const percentOf = (value: number, total: number) =>
  total === 0 ? 0 : (value / total) * 100

function RunSummary({
  headline,
  outcomes,
  children
}: Readonly<RunSummaryProps>) {
  const { rightFirstTry, selfGraded, missed, skipped, total } = outcomes

  const cells: StatCell[] = [
    { label: 'Correct', value: rightFirstTry, dotClassName: 'bg-success' },
    { label: 'Self-graded', value: selfGraded, dotClassName: 'bg-warning' },
    { label: 'Missed', value: missed, dotClassName: 'bg-destructive' },
    { label: 'Skipped', value: skipped, dotClassName: 'bg-neutral' }
  ]

  return (
    <section
      className="border-border bg-card rounded-lg border px-9 py-[34px]"
      data-slot="run-summary"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-12 gap-y-4 sm:flex-nowrap">
        <div className="min-w-0">
          <MicroLabel>Run complete</MicroLabel>
          <h1 className="mt-3 max-w-[42ch] text-[27px] leading-[1.22] font-semibold tracking-[-0.025em] text-balance">
            {headline}
          </h1>
        </div>
        <p className="flex shrink-0 items-baseline gap-2.5">
          <span
            className="font-mono text-[64px] leading-[0.86] tracking-[-0.08em]"
            data-numeric
          >
            {outcomes.percent}
          </span>
          <span className="text-muted-foreground font-mono text-xl tracking-[-0.06em]">
            %
          </span>
        </p>
      </div>

      <p className="text-muted-foreground mt-[26px] font-mono text-[11px]">
        {outcomes.score} / {total} scored
      </p>

      <div
        aria-hidden="true"
        className="bg-row-border dark:bg-secondary mt-2.5 flex h-2.5 overflow-hidden rounded-full"
      >
        <span className="animate-om-grow flex w-full">
          <span
            className="bg-success"
            style={{ width: `${percentOf(rightFirstTry, total)}%` }}
          />
          <span
            className="bg-warning"
            style={{ width: `${percentOf(selfGraded, total)}%` }}
          />
          <span
            className="bg-destructive"
            style={{ width: `${percentOf(missed, total)}%` }}
          />
          <span
            className="bg-neutral"
            style={{ width: `${percentOf(skipped, total)}%` }}
          />
        </span>
      </div>

      <dl className="bg-row-border mt-[26px] grid grid-cols-2 gap-px sm:grid-cols-4">
        {cells.map(({ label, value, dotClassName }) => (
          <div
            className="bg-card px-[18px] py-2 first:pl-0 sm:py-0"
            key={label}
          >
            <dt className="text-muted-foreground flex items-center gap-2 text-[13px]">
              <span
                aria-hidden="true"
                className={`size-2 rounded-full ${dotClassName}`}
              />
              {label}
            </dt>
            <dd
              className="mt-2 font-mono text-[22px] tracking-[-0.07em]"
              data-numeric
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>

      {children}
    </section>
  )
}

export { RunSummary }
