'use client'

import { useRouter } from 'next/navigation'
import { useRef } from 'react'

import { toast } from 'sonner'

import { Button } from '@/components/atoms'

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
    <div className="mt-6" data-slot="summary-actions">
      <div className="flex gap-3">
        <Button
          aria-label="Drill weak spots"
          className="min-h-11 flex-1 md:flex-none"
          disabled={!hasWeakSpots}
          variant={hasWeakSpots ? 'default' : 'ghost'}
          onClick={weakSpots}
        >
          Drill weak spots
          <kbd className="ml-2 hidden font-mono text-xs md:inline-flex">W</kbd>
        </Button>
        <Button
          aria-label="Retry same set"
          className="min-h-11 flex-1 md:flex-none"
          variant={hasWeakSpots ? 'ghost' : 'default'}
          onClick={retry}
        >
          Retry same set
          <kbd className="ml-2 hidden font-mono text-xs md:inline-flex">R</kbd>
        </Button>
      </div>
    </div>
  )
}

export { SummaryActions }
