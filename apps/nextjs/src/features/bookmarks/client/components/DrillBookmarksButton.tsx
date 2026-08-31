'use client'

import { useRouter } from 'next/navigation'
import { useRef } from 'react'

import { toast } from 'sonner'

import { startBookmarksRun } from '@/features/bookmarks/client/lib/startBookmarksRun'

interface DrillBookmarksButtonProps {
  certSlug: string
  count: number
}

function DrillBookmarksButton({
  certSlug,
  count
}: Readonly<DrillBookmarksButtonProps>) {
  const router = useRouter()
  const isPendingRef = useRef(false)

  if (count === 0) return null

  const onClick = () => {
    if (isPendingRef.current) return
    isPendingRef.current = true

    startBookmarksRun(certSlug)
      .match(
        ({ id }) => router.push(`/${certSlug}/drill/${id}`),
        (error) => toast.error(error.message)
      )
      .finally(() => {
        isPendingRef.current = false
      })
  }

  return (
    <button
      className="bg-foreground text-background fixed inset-x-4 bottom-20 z-30 flex min-h-11 items-center justify-center rounded-lg px-4 font-medium lg:static lg:inset-auto lg:w-fit"
      data-slot="drill-all-bookmarks"
      type="button"
      onClick={onClick}
    >
      Drill all {count} →
    </button>
  )
}

export { DrillBookmarksButton }
