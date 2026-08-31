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
  // A plain ref, not state: two keydowns can arrive before React flushes an
  // isSubmitting update, and both must still see the in-flight request.
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

  return (
    <div
      className="fixed inset-x-4 bottom-20 z-30 flex gap-3 md:static md:inset-auto md:mt-6 md:flex-row"
      data-slot="summary-actions"
    >
      <Button
        aria-label="Retry same set"
        className="min-h-11 flex-1 md:flex-none"
        onClick={retry}
      >
        Retry same set
        <kbd className="ml-2 hidden font-mono text-xs md:inline-flex">R</kbd>
      </Button>
      <Button
        aria-label="Drill weak spots"
        className="min-h-11 flex-1 md:flex-none"
        disabled={missCount === 0}
        variant="ghost"
        onClick={weakSpots}
      >
        Drill weak spots
        <kbd className="ml-2 hidden font-mono text-xs md:inline-flex">W</kbd>
      </Button>
    </div>
  )
}

export { SummaryActions }
