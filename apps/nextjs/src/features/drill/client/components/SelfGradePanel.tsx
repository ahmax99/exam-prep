'use client'

import { Button } from '@/components/atoms'

interface SelfGradePanelProps {
  outcome: 'had-it' | 'missed-it' | null
  isSubmitting: boolean
  onHadIt: () => void
  onMissedIt: () => void
}

const outcomeMessages: Record<'had-it' | 'missed-it', string> = {
  'had-it': 'Recorded: had it',
  'missed-it': 'Recorded: missed it'
}

function SelfGradePanel({
  outcome,
  isSubmitting,
  onHadIt,
  onMissedIt
}: Readonly<SelfGradePanelProps>) {
  if (outcome !== null) {
    return (
      <p
        className="text-muted-foreground mt-4 text-sm"
        data-slot="self-grade-panel"
      >
        {outcomeMessages[outcome]}
      </p>
    )
  }

  return (
    <div
      className="bg-background border-border fixed inset-x-0 bottom-0 flex items-center gap-3 border-t p-4 md:static md:mt-4 md:border-0 md:bg-transparent md:p-0"
      data-slot="self-grade-panel"
    >
      <Button
        className="min-h-11 flex-1 md:flex-none"
        disabled={isSubmitting}
        variant="ghost"
        onClick={onMissedIt}
      >
        I missed it
        <kbd className="text-muted-foreground ml-2 hidden font-mono text-xs md:inline-flex">
          N
        </kbd>
      </Button>
      <Button
        className="min-h-11 flex-1 md:flex-none"
        disabled={isSubmitting}
        onClick={onHadIt}
      >
        I had it
        <kbd className="text-primary-foreground/70 ml-2 hidden font-mono text-xs md:inline-flex">
          Y
        </kbd>
      </Button>
    </div>
  )
}

export { SelfGradePanel }
