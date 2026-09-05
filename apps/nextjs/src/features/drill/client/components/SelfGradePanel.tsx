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
        className="text-muted-foreground mt-6 text-sm"
        data-slot="self-grade-panel"
      >
        {outcomeMessages[outcome]}
      </p>
    )
  }

  return (
    <div
      className="border-warning/40 bg-warning/5 mt-6 rounded-lg border p-4"
      data-slot="self-grade-panel"
    >
      <p className="text-base font-medium">Did you have it?</p>
      <p
        className="text-muted-foreground mt-1 max-w-[60ch] text-sm"
        data-slot="self-grade-stakes"
      >
        This is recorded to your mastery tracking for this question and
        can&apos;t be changed afterwards.
      </p>
      <div className="mt-4 flex items-center gap-3">
        <Button
          className="min-h-11 flex-1"
          disabled={isSubmitting}
          size="lg"
          variant="outline"
          onClick={onMissedIt}
        >
          I missed it
          <kbd className="text-muted-foreground ml-2 hidden font-mono text-xs md:inline-flex">
            N
          </kbd>
        </Button>
        <Button
          className="min-h-11 flex-1"
          disabled={isSubmitting}
          size="lg"
          variant="outline"
          onClick={onHadIt}
        >
          I had it
          <kbd className="text-muted-foreground ml-2 hidden font-mono text-xs md:inline-flex">
            Y
          </kbd>
        </Button>
      </div>
    </div>
  )
}

export { SelfGradePanel }
