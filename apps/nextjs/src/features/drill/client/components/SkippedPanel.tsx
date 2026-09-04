'use client'

import { ListX } from 'lucide-react'

import { Button } from '@/components/atoms'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/molecules/Sheet'
import { stripInlineMarkdown } from '@/features/drill/lib/inlineMarkdown'

interface SkippedEntry {
  index: number
  id: string
  objective: string
  prompt: string
}

interface SkippedPanelProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  entries: SkippedEntry[]
  questionCount: number
  currentIndex: number
  isDisabled: boolean
  onJump: (index: number) => void
}

// The way back to a skipped question mid-run. A side sheet rather than a slot
// in DrillContextRail: the rail is desktop-only and deliberately inert, and
// this list is the one place in the drill that has to be both reachable on a
// phone and focusable.
function SkippedPanel({
  isOpen,
  onOpenChange,
  entries,
  questionCount,
  currentIndex,
  isDisabled,
  onJump
}: Readonly<SkippedPanelProps>) {
  return (
    <>
      {/* Nothing skipped yet is the normal state for most of a run — an
          always-present "Skipped 0" would be a permanent piece of furniture
          advertising a list that cannot be opened usefully. */}
      {entries.length > 0 && (
        <Button
          aria-label={`Skipped questions (${entries.length})`}
          className="min-h-11"
          disabled={isDisabled}
          size="sm"
          variant="ghost"
          onClick={() => onOpenChange(true)}
        >
          <ListX className="size-4" />
          <span aria-hidden="true">Skipped {entries.length}</span>
          <kbd className="text-muted-foreground ml-1 hidden font-mono text-xs md:inline-flex">
            L
          </kbd>
        </Button>
      )}

      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent data-slot="skipped-panel" side="right">
          <SheetHeader>
            <SheetTitle>Skipped questions</SheetTitle>
            <SheetDescription>
              Pick one to go back and answer it. Everything else in the run
              stays where it is.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            {entries.length === 0 ? (
              <p className="text-muted-foreground">
                Nothing skipped so far in this run.
              </p>
            ) : (
              <ol className="flex flex-col gap-1">
                {entries.map((entry) => (
                  <li key={entry.id}>
                    <button
                      aria-current={
                        entry.index === currentIndex ? 'true' : undefined
                      }
                      className="hover:bg-accent aria-[current]:border-brand border-border/0 flex w-full flex-col gap-1 rounded-lg border p-3 text-left"
                      type="button"
                      onClick={() => onJump(entry.index)}
                    >
                      <span
                        className="text-muted-foreground font-mono text-xs"
                        data-numeric
                      >
                        {entry.index + 1} / {questionCount} · {entry.objective}
                      </span>
                      <span className="line-clamp-2 leading-snug">
                        {stripInlineMarkdown(entry.prompt)}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

export { SkippedPanel }
export type { SkippedEntry }
