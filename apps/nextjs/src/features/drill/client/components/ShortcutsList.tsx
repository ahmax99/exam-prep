interface ShortcutsListProps {
  optionLetters: string[]
  canGoPrevious: boolean
  isSelfGrading: boolean
  isAnswered: boolean
}

// The list both DrillContextRail's desktop-only aside and ShortcutsHelp's
// reachable-everywhere sheet render — one source for which shortcuts are
// currently bound, so the two surfaces can't drift apart.
function ShortcutsList({
  optionLetters,
  canGoPrevious,
  isSelfGrading,
  isAnswered
}: Readonly<ShortcutsListProps>) {
  return (
    <dl className="flex flex-col gap-1.5 text-sm">
      {optionLetters.length > 0 && (
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
      {canGoPrevious && (
        <div className="flex items-center gap-2">
          <dt>
            <kbd className="font-mono text-xs">⌫</kbd>
          </dt>
          <dd className="text-muted-foreground">Previous question</dd>
        </div>
      )}
      <div className="flex items-center gap-2">
        <dt>
          <kbd className="font-mono text-xs">S</kbd>
        </dt>
        <dd className="text-muted-foreground">Skip</dd>
      </div>
      {!optionLetters.includes('B') && (
        <div className="flex items-center gap-2">
          <dt>
            <kbd className="font-mono text-xs">B</kbd>
          </dt>
          <dd className="text-muted-foreground">Bookmark</dd>
        </div>
      )}
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
      <div className="flex items-center gap-2">
        <dt>
          <kbd className="font-mono text-xs">?</kbd>
        </dt>
        <dd className="text-muted-foreground">This legend</dd>
      </div>
    </dl>
  )
}

export { ShortcutsList }
