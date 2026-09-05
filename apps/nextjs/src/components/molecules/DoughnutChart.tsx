import { cn } from '@/utils/mergeClass'
import { toPercent } from '@/utils/toPercent'

const RADIUS = 40
const STROKE_WIDTH = 14
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

type ChartColor = `var(--${string})`

interface DoughnutSegment {
  label: string
  value: number
  color: ChartColor
}

interface DoughnutChartProps {
  title: string
  unit: string
  segments: DoughnutSegment[]
  emptyMessage: string
  className?: string
}

interface DoughnutLegendProps {
  segments: DoughnutSegment[]
}

const sumSegments = (segments: DoughnutSegment[]) =>
  segments.reduce((sum, segment) => sum + segment.value, 0)

const DoughnutChart = ({
  title,
  unit,
  segments,
  emptyMessage,
  className
}: Readonly<DoughnutChartProps>) => {
  const total = sumSegments(segments)
  const ariaLabel = `${title}: ${segments
    .map((segment) => `${segment.value} ${segment.label}`)
    .join(', ')}, of ${total} total`

  const arcs = segments.reduce<
    { segment: DoughnutSegment; length: number; offset: number }[]
  >((acc, segment) => {
    if (segment.value <= 0) return acc

    const previousArc = acc.at(-1)
    const offset = previousArc ? previousArc.offset + previousArc.length : 0
    const length = (segment.value / total) * CIRCUMFERENCE
    acc.push({ segment, length, offset })
    return acc
  }, [])

  return (
    <figure
      className={cn('flex flex-col items-center gap-4 text-center', className)}
      data-slot="doughnut-chart"
    >
      <figcaption className="text-sm font-medium">{title}</figcaption>
      <div className="relative size-40 shrink-0">
        <svg
          aria-label={ariaLabel}
          className="size-full -rotate-90"
          role="img"
          viewBox="0 0 100 100"
        >
          <circle
            className="stroke-muted"
            cx="50"
            cy="50"
            fill="none"
            r={RADIUS}
            strokeWidth={STROKE_WIDTH}
          />
          {arcs.map(({ segment, length, offset: arcOffset }) => (
            <circle
              key={segment.label}
              cx="50"
              cy="50"
              fill="none"
              r={RADIUS}
              stroke={segment.color}
              strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
              strokeDashoffset={-arcOffset}
              strokeWidth={STROKE_WIDTH}
            >
              <title>{`${segment.label}: ${segment.value}`}</title>
            </circle>
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className="font-mono text-2xl">{total}</span>
          <span className="text-muted-foreground text-[10px]">{unit}</span>
        </div>
      </div>
      {total === 0 ? (
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      ) : (
        <DoughnutLegend segments={segments} />
      )}
    </figure>
  )
}

const DoughnutLegend = ({ segments }: Readonly<DoughnutLegendProps>) => {
  const total = sumSegments(segments)

  return (
    <ul className="flex w-full flex-col gap-1" data-slot="doughnut-legend">
      {segments.map((segment) => (
        <li className="flex items-center gap-2 text-sm" key={segment.label}>
          <span
            aria-hidden="true"
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: segment.color }}
          />
          <span className="text-muted-foreground flex-1 truncate text-left">
            {segment.label}
          </span>
          <span className="font-mono">{segment.value}</span>
          <span className="text-muted-foreground w-12 text-right font-mono text-xs">
            {`(${toPercent(segment.value, total)}%)`}
          </span>
        </li>
      ))}
    </ul>
  )
}

export { DoughnutChart }
export type { DoughnutSegment }
