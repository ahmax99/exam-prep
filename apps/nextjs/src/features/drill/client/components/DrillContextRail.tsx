'use client'

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
        <p className="text-muted-foreground text-sm">Progress</p>
        <p className="mt-2 font-mono text-2xl leading-none" data-numeric>
          {currentIndex + 1}
          <span className="text-muted-foreground text-base">
            {' '}
            / {questionCount}
          </span>
        </p>
        <span className="bg-secondary mt-3 block h-1.5 overflow-hidden rounded-full">
          <span
            className="bg-brand block h-full rounded-full transition-[width] duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </span>
        <p
          className="text-muted-foreground mt-2 font-mono text-xs"
          data-numeric
        >
          {progressPercent}% complete
        </p>
      </div>

      <div className="mt-8">
        <p className="text-muted-foreground text-sm">Shortcuts</p>
        <div className="mt-2">
          <ShortcutsList shortcuts={shortcuts} />
        </div>
      </div>
    </aside>
  )
}

export { DrillContextRail }
