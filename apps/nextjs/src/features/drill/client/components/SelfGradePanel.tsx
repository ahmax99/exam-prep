'use client'

import { Button, ShortcutHint } from '@/components/atoms'

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
      /* The 2px left rule is the only other place a 2px border is allowed:
         it ties this panel to the warning verdict that raised it. */
      className="border-input border-l-warning bg-muted animate-om-reveal mt-[26px] rounded-md border border-l-2 px-[22px] py-5"
      data-slot="self-grade-panel"
    >
      <p className="text-[17px] font-semibold tracking-tight">
        Did you have it?
      </p>
      <p
        className="text-prose-foreground mt-1.5 max-w-[60ch] text-sm"
        data-slot="self-grade-stakes"
      >
        This is recorded to your mastery tracking for this question and
        can&apos;t be changed afterwards.
      </p>
      <div className="mt-[18px] flex items-center gap-3.5">
        <Button
          className="flex-1"
          disabled={isSubmitting}
          size="lg"
          variant="outline"
          onClick={onMissedIt}
        >
          I missed it
          <ShortcutHint className="text-muted-foreground" keyLabel="N" />
        </Button>
        <Button
          className="flex-1"
          disabled={isSubmitting}
          size="lg"
          variant="outline"
          onClick={onHadIt}
        >
          I had it
          <ShortcutHint className="text-muted-foreground" keyLabel="Y" />
        </Button>
      </div>
    </div>
  )
}

export { SelfGradePanel }
