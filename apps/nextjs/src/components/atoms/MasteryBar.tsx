import { cn } from '@/utils/mergeClass'

interface MasteryBarProps {
  mastered: number
  shaky: number
  total: number
  className?: string
}

function MasteryBar({
  mastered,
  shaky,
  total,
  className
}: Readonly<MasteryBarProps>) {
  const masteredPercent = total === 0 ? 0 : (mastered / total) * 100
  const shakyPercent = total === 0 ? 0 : (shaky / total) * 100

  return (
    <div
      aria-label={`${Math.round(masteredPercent)}% mastered`}
      className={cn(
        'bg-muted flex h-2 overflow-hidden rounded-full',
        className
      )}
      data-slot="mastery-bar"
      role="img"
    >
      <div
        className="bg-success h-full"
        style={{ width: `${masteredPercent}%` }}
      />
      <div
        className="bg-warning h-full"
        style={{ width: `${shakyPercent}%` }}
      />
    </div>
  )
}

export { MasteryBar }
