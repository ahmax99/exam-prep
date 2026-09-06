'use client'

import { useRouter } from 'next/navigation'
import { useRef } from 'react'

import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/atoms'
import { startRun } from '@/features/drill/client/lib/startRun'

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

    startRun({
      scopeKind: 'BOOKMARKS',
      scopeValue: '',
      certSlug,
      limit: count
    })
      .match(
        ({ id }) => router.push(`/${certSlug}/drill/${id}`),
        (error) => toast.error(error.message)
      )
      .finally(() => {
        isPendingRef.current = false
      })
  }

  return (
    <Button
      className="w-full lg:w-fit"
      data-slot="drill-all-bookmarks"
      variant="brand"
      onClick={onClick}
    >
      Drill {count}
      <ArrowRight aria-hidden="true" className="size-4" />
    </Button>
  )
}

export { DrillBookmarksButton }
