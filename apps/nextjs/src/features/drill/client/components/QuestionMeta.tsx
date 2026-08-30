'use client'

import type { ReactNode } from 'react'

import { Bookmark } from 'lucide-react'

import type { QuestionType } from '@/lib/prisma'

interface QuestionMetaProps {
  objective: string
  type: QuestionType
  timesSeen: number
  isBookmarked: boolean
  onToggleBookmark: () => void
  bookmarkSlot?: ReactNode
}

const TYPE_LABELS: Record<QuestionType, string> = {
  SINGLE_ANSWER: 'Single answer',
  MULTIPLE_ANSWER: 'Multiple answer',
  FILL_IN: 'Fill in'
}

const ordinal = (value: number) => {
  const remainder100 = value % 100
  if (remainder100 >= 11 && remainder100 <= 13) return `${value}th`
  switch (value % 10) {
    case 1:
      return `${value}st`
    case 2:
      return `${value}nd`
    case 3:
      return `${value}rd`
    default:
      return `${value}th`
  }
}

function QuestionMeta({
  objective,
  type,
  timesSeen,
  isBookmarked,
  onToggleBookmark,
  bookmarkSlot
}: Readonly<QuestionMetaProps>) {
  return (
    <div
      className="text-muted-foreground flex items-center gap-2 text-sm"
      data-slot="question-meta"
    >
      <span className="font-mono">{objective}</span>
      <span>{TYPE_LABELS[type]}</span>
      {timesSeen >= 1 && <span>{ordinal(timesSeen + 1)} time seen</span>}
      <span className="ml-auto">
        {bookmarkSlot ?? (
          // Issue #10 replaces this with the persisted BookmarkToggle.
          <button
            aria-label="Bookmark question"
            aria-pressed={isBookmarked}
            className="flex min-h-11 min-w-11 items-center justify-center"
            type="button"
            onClick={onToggleBookmark}
          >
            <Bookmark
              className="size-4"
              fill={isBookmarked ? 'currentColor' : 'none'}
            />
          </button>
        )}
      </span>
    </div>
  )
}

export { QuestionMeta }
