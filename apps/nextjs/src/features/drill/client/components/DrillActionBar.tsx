'use client'

import { Button } from '@/components/atoms'

interface DrillActionBarProps {
  // A named variant rather than an `isAnswered` flag: the bar has two distinct
  // shapes, and the mode picks one instead of combining with the gates below.
  mode: 'answer' | 'next'
  isBlocked: boolean
  canSubmit: boolean
  isSubmitting: boolean
  // Absent when there is nowhere to go back to, so the button simply isn't
  // rendered — no separate "can" flag to keep in sync with the handler.
  onPrevious?: () => void
  onNext: () => void
  onSkip: () => void
  onSubmit: () => void
}

const shortcutHintClassName =
  'text-muted-foreground ml-2 hidden font-mono text-xs md:inline-flex'

// Fixed to the bottom of the viewport on mobile so the primary action stays
// reachable under a long prompt; an ordinary block in the flow from md up.
function DrillActionBar({
  mode,
  isBlocked,
  canSubmit,
  isSubmitting,
  onPrevious,
  onNext,
  onSkip,
  onSubmit
}: Readonly<DrillActionBarProps>) {
  return (
    <div
      className="bg-background border-border fixed inset-x-0 bottom-0 flex items-center gap-3 border-t p-4 md:static md:mt-6 md:border-0 md:bg-transparent md:p-0"
      data-slot="drill-action-bar"
    >
      {onPrevious && (
        <Button variant="ghost" onClick={onPrevious}>
          Previous
          <kbd className={shortcutHintClassName}>⌫</kbd>
        </Button>
      )}
      {mode === 'next' ? (
        <Button
          className="ml-auto"
          disabled={isBlocked}
          // Blocked pending a self-grade: a washed-out accent button reads as
          // broken, so it steps back to outline until it can be used.
          variant={isBlocked ? 'outline' : 'brand'}
          onClick={onNext}
        >
          Next question
          <kbd className={shortcutHintClassName}>↵</kbd>
        </Button>
      ) : (
        <>
          <Button disabled={isBlocked} variant="ghost" onClick={onSkip}>
            Skip
            <kbd className={shortcutHintClassName}>S</kbd>
          </Button>
          <Button
            className="ml-auto"
            disabled={!canSubmit || isSubmitting}
            variant="brand"
            onClick={onSubmit}
          >
            Submit
            <kbd className="text-brand-foreground/70 ml-2 hidden font-mono text-xs md:inline-flex">
              ↵
            </kbd>
          </Button>
        </>
      )}
    </div>
  )
}

export { DrillActionBar }
