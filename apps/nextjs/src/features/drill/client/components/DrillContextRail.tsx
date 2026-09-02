'use client'

interface DrillContextRailProps {
  currentIndex: number
  questionCount: number
  progressPercent: number
  isAnswered: boolean
  isSelfGrading: boolean
  hasOptions: boolean
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
  hasOptions
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
        <dl className="mt-2 flex flex-col gap-1.5 text-sm">
          {hasOptions && !isAnswered && (
            <div className="flex items-center gap-2">
              <dt>
                <kbd className="font-mono text-xs">A–Z</kbd>
              </dt>
              <dd className="text-muted-foreground">Select an option</dd>
            </div>
          )}
          <div className="flex items-center gap-2">
            <dt>
              <kbd className="font-mono text-xs">↵</kbd>
            </dt>
            <dd className="text-muted-foreground">
              {isAnswered ? 'Next question' : 'Submit'}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt>
              <kbd className="font-mono text-xs">S</kbd>
            </dt>
            <dd className="text-muted-foreground">Skip</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt>
              <kbd className="font-mono text-xs">B</kbd>
            </dt>
            <dd className="text-muted-foreground">Bookmark</dd>
          </div>
          {isSelfGrading && (
            <>
              <div className="flex items-center gap-2">
                <dt>
                  <kbd className="font-mono text-xs">Y</kbd>
                </dt>
                <dd className="text-muted-foreground">Had it</dd>
              </div>
              <div className="flex items-center gap-2">
                <dt>
                  <kbd className="font-mono text-xs">N</kbd>
                </dt>
                <dd className="text-muted-foreground">Missed it</dd>
              </div>
            </>
          )}
        </dl>
      </div>
    </aside>
  )
}

export { DrillContextRail }
