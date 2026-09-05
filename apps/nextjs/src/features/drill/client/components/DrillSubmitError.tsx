'use client'

import { Button } from '@/components/atoms'

import type { FailedSubmit } from '../hooks/useDrillSubmissions'

const SUBMIT_ERROR_MESSAGES: Record<FailedSubmit['kind'], string> = {
  answer: "We couldn't save your answer. Nothing was recorded — try again.",
  'self-grade': "We couldn't record how you graded yourself. Try again."
}

interface DrillSubmitErrorProps {
  kind: FailedSubmit['kind']
  isRetrying: boolean
  onRetry: () => void
}

function DrillSubmitError({
  kind,
  isRetrying,
  onRetry
}: Readonly<DrillSubmitErrorProps>) {
  return (
    <div
      className="border-destructive/40 bg-destructive/10 text-destructive mt-4 flex items-center gap-3 rounded-lg border p-3 text-sm"
      data-slot="drill-submit-error"
      role="alert"
    >
      <p className="flex-1">{SUBMIT_ERROR_MESSAGES[kind]}</p>
      <Button
        disabled={isRetrying}
        size="sm"
        variant="destructive"
        onClick={onRetry}
      >
        Retry
      </Button>
    </div>
  )
}

export { DrillSubmitError }
