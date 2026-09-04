'use client'

import { ShortcutsList } from './ShortcutsList'

interface DrillContextRailProps {
  currentIndex: number
  questionCount: number
  progressPercent: number
  isAnswered: boolean
  isSelfGrading: boolean
  optionLetters: string[]
  canGoPrevious: boolean
}

// Purely presentational: no state, no handlers, no focusable elements — it
// must stay inert so it can safely live inside DrillCard's `containerRef`
// without expanding useDrillKeys' focus-containment gate to a new tab stop.
function DrillContextRail({
  currentIndex,
  questionCount,
  progressPercent,
  isAnswered,
  isSelfGrading,
  optionLetters,
  canGoPrevious
}: Readonly<DrillContextRailProps>) {
  return (
    <aside
      className="border-border hidden border-l pl-8 xl:block"
      data-slot="drill-context-rail"
    >
      <div aria-hidden="true">
        <p className="text-muted-foreground text-sm">Progress</p>
        {/* The position in the run is the rail's whole job, so the counter is
            set at the scale you can read without stopping to look. */}
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
          <ShortcutsList
            canGoPrevious={canGoPrevious}
            isAnswered={isAnswered}
            isSelfGrading={isSelfGrading}
            optionLetters={optionLetters}
          />
        </div>
      </div>
    </aside>
  )
}

export { DrillContextRail }
