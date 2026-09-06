import { cn } from '@/utils/mergeClass'

interface MasteryBarProps {
  mastered: number
  shaky: number
  total: number
  animate?: boolean
  className?: string
}

function MasteryBar({
  mastered,
  shaky,
  total,
  animate = false,
  className
}: Readonly<MasteryBarProps>) {
  const masteredPercent = total === 0 ? 0 : (mastered / total) * 100
  const shakyPercent = total === 0 ? 0 : (shaky / total) * 100

  return (
    <div
      aria-label={`${Math.round(masteredPercent)}% mastered`}
      className={cn(
        'bg-secondary flex h-1.5 overflow-hidden rounded-full',
        className
      )}
      data-slot="mastery-bar"
      role="img"
    >
      <span
        className={cn('flex w-full', animate && 'animate-om-grow')}
        data-slot="mastery-bar-fill"
      >
        <span
          className="bg-success h-full"
          style={{ width: `${masteredPercent}%` }}
        />
        <span
          className="bg-warning h-full"
          style={{ width: `${shakyPercent}%` }}
        />
      </span>
    </div>
  )
}

export { MasteryBar }
