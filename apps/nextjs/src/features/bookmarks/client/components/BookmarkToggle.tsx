'use client'

import type { Ref } from 'react'
import { useRef, useState } from 'react'

import { Bookmark } from 'lucide-react'
import { toast } from 'sonner'

import { removeBookmark } from '@/features/bookmarks/client/lib/removeBookmark'
import { setBookmark } from '@/features/bookmarks/client/lib/setBookmark'
import { cn } from '@/utils/mergeClass'

interface BookmarkToggleProps {
  questionId: string
  initialBookmarked: boolean
  ref?: Ref<HTMLButtonElement>
  className?: string
}

function BookmarkToggle({
  questionId,
  initialBookmarked,
  ref,
  className
}: Readonly<BookmarkToggleProps>) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked)
  // A plain ref, not state: a second click arriving before React flushes the
  // first must still see the in-flight request.
  const isPendingRef = useRef(false)

  const onClick = () => {
    if (isPendingRef.current) return
    isPendingRef.current = true

    const previous = isBookmarked
    const next = !previous
    setIsBookmarked(next)

    const request = next
      ? setBookmark({ questionId })
      : removeBookmark(questionId)

    request
      .match(
        () => {},
        (error) => {
          setIsBookmarked(previous)
          toast.error(error.message)
        }
      )
      .finally(() => {
        isPendingRef.current = false
      })
  }

  return (
    <button
      ref={ref}
      aria-label={
        isBookmarked ? 'Bookmarked for revision' : 'Bookmark for revision'
      }
      aria-pressed={isBookmarked}
      className={cn(
        'flex min-h-11 min-w-11 items-center justify-center',
        isBookmarked ? 'text-warning' : 'text-muted-foreground',
        className
      )}
      data-slot="bookmark-toggle"
      type="button"
      onClick={onClick}
    >
      <Bookmark
        className="size-4"
        fill={isBookmarked ? 'currentColor' : 'none'}
      />
    </button>
  )
}

export { BookmarkToggle }
