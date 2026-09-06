'use client'

import { useRouter } from 'next/navigation'
import { useRef } from 'react'

import { toast } from 'sonner'

import { Button, ShortcutHint } from '@/components/atoms'

import { useSummaryKeys } from '../hooks/useSummaryKeys'
import { retryRun, startRun } from '../lib/startRun'

interface SummaryActionsProps {
  runId: string
  certSlug: string
  missCount: number
}

function SummaryActions({
  runId,
  certSlug,
  missCount
}: Readonly<SummaryActionsProps>) {
  const router = useRouter()

  const isStartingRef = useRef(false)

  const retry = () => {
    if (isStartingRef.current) return
    isStartingRef.current = true
    retryRun(runId)
      .match(
        (run) => router.push(`/${certSlug}/drill/${run.id}`),
        (error) => toast.error(error.message)
      )
      .finally(() => {
        isStartingRef.current = false
      })
  }

  const weakSpots = () => {
    if (isStartingRef.current) return
    isStartingRef.current = true
    startRun({ scopeKind: 'MISSED', scopeValue: certSlug, certSlug })
      .match(
        (run) => router.push(`/${certSlug}/drill/${run.id}`),
        (error) => toast.error(error.message)
      )
      .finally(() => {
        isStartingRef.current = false
      })
  }

  useSummaryKeys({
    onRetry: retry,
    onWeakSpots: missCount > 0 ? weakSpots : null
  })

  const hasWeakSpots = missCount > 0

  return (
    <div className="mt-[30px] flex gap-3.5" data-slot="summary-actions">
      <Button
        aria-label="Drill weak spots"
        className="flex-1 md:flex-none"
        disabled={!hasWeakSpots}
        variant={hasWeakSpots ? 'brand' : 'outline'}
        onClick={weakSpots}
      >
        Drill weak spots
        <ShortcutHint keyLabel="W" />
      </Button>
      <Button
        aria-label="Retry same set"
        className="flex-1 md:flex-none"
        variant={hasWeakSpots ? 'outline' : 'brand'}
        onClick={retry}
      >
        Retry same set
        <ShortcutHint
          className={hasWeakSpots ? 'text-muted-foreground' : undefined}
          keyLabel="R"
        />
      </Button>
    </div>
  )
}

export { SummaryActions }
