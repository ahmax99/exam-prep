'use client'

import { Button, ShortcutHint } from '@/components/atoms'

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
      className="bg-card border-border fixed inset-x-0 bottom-0 z-30 flex items-center gap-3.5 border-t p-4 md:static md:mt-8 md:border-0 md:bg-transparent md:p-0"
      data-slot="drill-action-bar"
    >
      {onPrevious && (
        <Button variant="ghost" onClick={onPrevious}>
          Previous
          <ShortcutHint keyLabel="⌫" />
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
          <ShortcutHint keyLabel="↵" />
        </Button>
      ) : (
        <>
          <Button disabled={isBlocked} variant="ghost" onClick={onSkip}>
            Skip
            <ShortcutHint keyLabel="S" />
          </Button>
          <Button
            className="ml-auto"
            disabled={!canSubmit || isSubmitting}
            variant={canSubmit ? 'brand' : 'outline'}
            onClick={onSubmit}
          >
            Submit
            <ShortcutHint
              className={canSubmit ? undefined : 'text-muted-foreground'}
              keyLabel="↵"
            />
          </Button>
        </>
      )}
    </div>
  )
}

export { DrillActionBar }
