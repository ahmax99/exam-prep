'use client'

import { MicroLabel } from '@/components/atoms'
import type { Shortcut } from '@/features/drill/lib/shortcuts'

import { ShortcutsList } from './ShortcutsList'

interface DrillContextRailProps {
  currentIndex: number
  questionCount: number
  progressPercent: number
  shortcuts: Shortcut[]
}

function DrillContextRail({
  currentIndex,
  questionCount,
  progressPercent,
  shortcuts
}: Readonly<DrillContextRailProps>) {
  return (
    <aside
      className="border-border hidden border-l pl-8 xl:block"
      data-slot="drill-context-rail"
    >
      <div aria-hidden="true">
        <MicroLabel>Progress</MicroLabel>
        <p className="mt-3 flex items-baseline gap-1.5">
          <span
            className="font-mono text-[34px] leading-none tracking-[-0.08em]"
            data-numeric
          >
            {currentIndex + 1}
          </span>
          <span className="text-muted-foreground font-mono text-[15px] tracking-[-0.05em]">
            / {questionCount}
          </span>
        </p>
        <span className="bg-row-border dark:bg-secondary mt-3.5 block h-1.5 overflow-hidden rounded-full">
          <span
            className="bg-brand block h-full rounded-full transition-[width] duration-[320ms] ease-[var(--ease-om)]"
            style={{ width: `${progressPercent}%` }}
          />
        </span>
        <p className="text-muted-foreground mt-2.5 font-mono text-[10px]">
          {progressPercent}% complete
        </p>
      </div>

      <div className="mt-9">
        <MicroLabel>Shortcuts</MicroLabel>
        <div className="mt-3">
          <ShortcutsList shortcuts={shortcuts} />
        </div>
      </div>
    </aside>
  )
}

export { DrillContextRail }
