'use client'

import { Button } from '@/components/atoms'

interface DrillActionBarProps {
  mode: 'answer' | 'next'
  isBlocked: boolean
  canSubmit: boolean
  isSubmitting: boolean

  onPrevious?: () => void
  onNext: () => void
  onSkip: () => void
  onSubmit: () => void
}

const shortcutHintClassName =
  'text-muted-foreground ml-2 hidden font-mono text-xs md:inline-flex'

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
