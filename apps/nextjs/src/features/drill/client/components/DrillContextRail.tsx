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
        <p className="mt-1 font-mono text-sm">
          {currentIndex + 1} / {questionCount}
          <span className="text-muted-foreground ml-2">{progressPercent}%</span>
        </p>
        <span className="bg-muted mt-2 block h-1.5 overflow-hidden rounded-full">
          <span
            className="bg-foreground block h-full rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </span>
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
