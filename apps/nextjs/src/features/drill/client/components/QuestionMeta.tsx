'use client'

import type { Ref } from 'react'

import { BookmarkToggle } from '@/features/bookmarks/client/components/BookmarkToggle'
import type { QuestionType } from '@/lib/prisma'

interface QuestionMetaProps {
  questionId: string
  objective: string
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
  type,
  timesSeen,
  initialBookmarked,
  toggleRef
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
