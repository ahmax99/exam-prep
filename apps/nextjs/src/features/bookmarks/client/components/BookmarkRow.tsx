'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Bookmark } from 'lucide-react'
import { toast } from 'sonner'

import { masteryChipVariants } from '@/features/bookmarks/client/components/BookmarkRow.variants'
import { removeBookmark } from '@/features/bookmarks/client/lib/removeBookmark'
import { setBookmark } from '@/features/bookmarks/client/lib/setBookmark'
import type { BookmarkListItem } from '@/features/bookmarks/server/api'
import { PromptMarkdown } from '@/features/drill/client/components/PromptMarkdown'
import { QUESTION_TYPE_LABELS } from '@/features/drill/constants'

interface BookmarkRowProps {
  item: BookmarkListItem
}

function BookmarkRow({ item }: Readonly<BookmarkRowProps>) {
  const router = useRouter()
  const [isRemoving, setIsRemoving] = useState(false)

  const undoRemove = () => {
    setBookmark({ questionId: item.questionId, note: item.note }).match(
      () => router.refresh(),
      (error) => toast.error(error.message)
    )
  }

  const onRemove = () => {
    if (isRemoving) return
    setIsRemoving(true)

    removeBookmark(item.questionId)
      .match(
        () => {
          router.refresh()
          toast.success('Bookmark removed', {
            action: { label: 'Undo', onClick: undoRemove }
          })
        },
        (error) => toast.error(error.message)
      )
      .finally(() => {
        setIsRemoving(false)
      })
  }

  return (
    <li
      className="border-row-border flex items-start gap-5 px-6 py-5 not-first:border-t"
      data-slot="bookmark-row"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-[11px] tracking-[-0.04em]">
            {item.objective}
          </span>
          <span className="text-muted-foreground text-sm">
            {QUESTION_TYPE_LABELS[item.type]}
          </span>
          <span
            className={masteryChipVariants({ state: item.state ?? 'unseen' })}
          >
            {item.state ?? 'unseen'}
          </span>
        </div>
        <p className="mt-2.5 min-w-0 text-base leading-[1.55] break-words">
          <PromptMarkdown text={item.prompt} />
        </p>
        {item.note !== null && (
          <p
            className="text-muted-foreground mt-2 min-w-0 text-sm break-words"
            data-slot="bookmark-note"
          >
            {item.note}
          </p>
        )}
      </div>
      {/* Filled brand that unfills to muted on hover — the same gesture the
          bookmark toggle uses mid-drill, rather than a generic x. */}
      <button
        aria-label="Remove bookmark"
        className="text-brand hover:text-muted-foreground inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-[4px] transition-colors disabled:opacity-50"
        disabled={isRemoving}
        type="button"
        onClick={onRemove}
      >
        <Bookmark className="size-[17px] fill-current" />
      </button>
    </li>
  )
}

export { BookmarkRow }
