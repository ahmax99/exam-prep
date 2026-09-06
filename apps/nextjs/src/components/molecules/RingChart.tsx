import { cn } from '@/utils/mergeClass'

const RADIUS = 40
const STROKE_WIDTH = 9
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

type ChartColor = `var(--${string})`

interface RingSegment {
  label: string
  value: number
  color: ChartColor
}

interface RingChartProps {
  title: string
  unit: string
  segments: RingSegment[]
  emptyMessage: string
  className?: string
}

const sumSegments = (segments: RingSegment[]) =>
  segments.reduce((sum, segment) => sum + segment.value, 0)

const RingChart = ({
  title,
  unit,
  segments,
  emptyMessage,
  className
}: Readonly<RingChartProps>) => {
  const total = sumSegments(segments)
  const ariaLabel = `${title}: ${segments
    .map((segment) => `${segment.value} ${segment.label}`)
    .join(', ')}, of ${total} total`

  const arcs = segments.reduce<
    { segment: RingSegment; length: number; offset: number }[]
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
      className={cn(
        'border-border bg-card flex flex-col items-center gap-6 rounded-md border px-[26px] py-6 sm:flex-row sm:gap-[26px]',
        className
      )}
      data-slot="ring-chart"
    >
      <div className="relative size-32 shrink-0">
        <svg
          aria-label={ariaLabel}
          className="size-full -rotate-90"
          role="img"
          viewBox="0 0 100 100"
        >
          <circle
            className="stroke-row-border dark:stroke-secondary"
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
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-[26px] leading-none tracking-[-0.06em]">
            {total}
          </span>
          <span className="text-muted-foreground mt-0.5 font-mono text-[8px] tracking-wider uppercase">
            {unit}
          </span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <figcaption className="text-[15px] font-semibold tracking-tight">
          {title}
        </figcaption>
        {total === 0 ? (
          <p className="text-muted-foreground mt-3.5 text-sm">{emptyMessage}</p>
        ) : (
          <ul className="mt-3.5 font-mono text-[10px]" data-slot="ring-legend">
            {segments.map((segment) => (
              <li
                className="flex h-7 items-center gap-[9px]"
                key={segment.label}
              >
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-muted-foreground min-w-0 flex-1 truncate">
                  {segment.label}
                </span>
                <span>{segment.value}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </figure>
  )
}

export { RingChart }
export type { RingSegment }
