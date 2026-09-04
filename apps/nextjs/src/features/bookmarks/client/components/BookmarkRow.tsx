'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { toast } from 'sonner'

import { masteryChipVariants } from '@/features/bookmarks/client/components/BookmarkRow.variants'
import { removeBookmark } from '@/features/bookmarks/client/lib/removeBookmark'
import { setBookmark } from '@/features/bookmarks/client/lib/setBookmark'
import type { BookmarkListItem } from '@/features/bookmarks/server/api'
import { PromptMarkdown } from '@/features/drill/client/components/PromptMarkdown'
import type { QuestionType } from '@/lib/prisma'

interface BookmarkRowProps {
  item: BookmarkListItem
}

const TYPE_LABELS: Record<QuestionType, string> = {
  SINGLE_ANSWER: 'Single answer',
  MULTIPLE_ANSWER: 'Multiple answer',
  FILL_IN: 'Fill in'
}

function BookmarkRow({ item }: Readonly<BookmarkRowProps>) {
  const router = useRouter()
  const [isRemoving, setIsRemoving] = useState(false)

  const undoRemove = () => {
    // The row is unmounted by the refresh below, so this closure must not
    // touch component state — only the captured item and the router.
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
      className="border-border flex flex-col gap-2 border-b py-4 md:flex-row md:items-start"
      data-slot="bookmark-row"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm">{item.objective}</span>
          <span className="text-muted-foreground text-sm">
            {TYPE_LABELS[item.type]}
          </span>
          <span
            className={masteryChipVariants({ state: item.state ?? 'unseen' })}
          >
            {item.state ?? 'unseen'}
          </span>
        </div>
        <p className="mt-2 min-w-0 leading-relaxed break-words">
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
      <button
        aria-label={`Remove bookmark for ${item.objective}`}
        className="text-muted-foreground min-h-11 shrink-0 self-start px-2 text-sm disabled:opacity-50"
        disabled={isRemoving}
        type="button"
        onClick={onRemove}
      >
        Remove
      </button>
    </li>
  )
}

export { BookmarkRow }
