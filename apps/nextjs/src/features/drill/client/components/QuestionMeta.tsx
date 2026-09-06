'use client'

import type { Ref } from 'react'

import { BookmarkToggle } from '@/features/bookmarks/client/components/BookmarkToggle'
import { QUESTION_TYPE_LABELS } from '@/features/drill/constants'
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

const Separator = () => (
  <span aria-hidden="true" className="bg-neutral size-[3px] rounded-full" />
)

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
      className="text-muted-foreground flex items-start gap-3.5 text-sm"
      data-slot="question-meta"
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
        <span className="bg-accent text-accent-foreground inline-flex h-[22px] items-center rounded-[3px] px-2 font-mono text-[10px] font-medium whitespace-nowrap">
          {objective}
        </span>
        <span className="min-w-0 truncate">{topic}</span>
        <Separator />
        <span className="whitespace-nowrap">{QUESTION_TYPE_LABELS[type]}</span>
        {timesSeen >= 1 && (
          <>
            <Separator />
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
