'use client'

import type { Ref } from 'react'

import { BookmarkToggle } from '@/features/bookmarks/client/components/BookmarkToggle'
import type { QuestionType } from '@/lib/prisma'

interface QuestionMetaProps {
  questionId: string
  objective: string
  topic: string
  type: QuestionType
  timesSeen: number
  initialBookmarked: boolean
  toggleRef?: Ref<HTMLButtonElement>
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
  questionId,
  objective,
  topic,
  type,
  timesSeen,
  initialBookmarked,
  toggleRef
}: Readonly<QuestionMetaProps>) {
  return (
    <div
      className="text-muted-foreground flex items-start gap-3 text-sm"
      data-slot="question-meta"
    >
      {}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-foreground font-mono whitespace-nowrap">
          {objective}
        </span>
        <span className="min-w-0 truncate">{topic}</span>
        <span aria-hidden="true">·</span>
        <span className="whitespace-nowrap">{TYPE_LABELS[type]}</span>
        {timesSeen >= 1 && (
          <>
            <span aria-hidden="true">·</span>
            <span className="whitespace-nowrap">
              {ordinal(timesSeen + 1)} time seen
            </span>
          </>
        )}
      </div>
      <span className="shrink-0">
        <BookmarkToggle
          key={questionId}
          initialBookmarked={initialBookmarked}
          questionId={questionId}
          ref={toggleRef}
        />
      </span>
    </div>
  )
}

export { QuestionMeta }
