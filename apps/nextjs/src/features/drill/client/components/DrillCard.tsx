'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { toast } from 'sonner'

import { Button } from '@/components/atoms'
import type { AnswerVerdict } from '@/features/drill/schemas/answerVerdict.schema'
import type { QuestionType } from '@/lib/prisma'

import { useDrillKeys } from '../hooks/useDrillKeys'
import { submitAnswer } from '../lib/submitAnswer'

import { ChoiceOptions } from './ChoiceOptions'
import { ExplanationPanel } from './ExplanationPanel'
import { PromptMarkdown } from './PromptMarkdown'
import { QuestionMeta } from './QuestionMeta'

interface DrillQuestion {
  id: string
  objective: string
  type: QuestionType
  prompt: string
  options: { letter: string; text: string }[]
  timesSeen: number
}

interface DrillCardProps {
  runId: string
  certSlug: string
  questions: DrillQuestion[]
  startIndex: number
}

function DrillCard({
  runId,
  certSlug,
  questions,
  startIndex
}: Readonly<DrillCardProps>) {
  const router = useRouter()
  // startIndex is read once: a route param change (new runId) remounts this
  // whole page tree, so the prop never changes under a live instance.
  const [currentIndex, setCurrentIndex] = useState(startIndex)
  const [selectedLetters, setSelectedLetters] = useState<string[]>([])
  const [verdict, setVerdict] = useState<AnswerVerdict | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())
  // A plain ref, not `isSubmitting` state: two keydown events arriving before
  // React flushes a state update must still see the in-flight request.
  const isSubmittingRef = useRef(false)

  const question = questions[currentIndex]

  const toggleBookmark = () => {
    if (!question) return
    setBookmarkedIds((current) => {
      const next = new Set(current)
      if (next.has(question.id)) next.delete(question.id)
      else next.add(question.id)
      return next
    })
  }

  const toggle = (letter: string) => {
    if (verdict !== null || !question) return
    setSelectedLetters((current) =>
      question.type === 'SINGLE_ANSWER'
        ? [letter]
        : current.includes(letter)
          ? current.filter((selected) => selected !== letter)
          : [...current, letter]
    )
  }

  const goNext = () => {
    if (currentIndex + 1 >= questions.length) {
      router.push(`/${certSlug}/drill/${runId}/summary`)
      return
    }
    setCurrentIndex((current) => current + 1)
    setSelectedLetters([])
    setVerdict(null)
  }

  const submit = () => {
    if (!question || selectedLetters.length === 0 || isSubmittingRef.current)
      return
    isSubmittingRef.current = true
    setIsSubmitting(true)
    const response =
      question.type === 'SINGLE_ANSWER'
        ? (selectedLetters[0] ?? '')
        : selectedLetters

    submitAnswer({ runId, questionId: question.id, response })
      .match(
        (result) => setVerdict(result),
        (error) => toast.error(error.message)
      )
      .finally(() => {
        isSubmittingRef.current = false
        setIsSubmitting(false)
      })
  }

  const skip = () => goNext()

  useDrillKeys({
    optionLetters: verdict
      ? []
      : (question?.options.map((o) => o.letter) ?? []),
    onLetter: toggle,
    onPrimary: verdict ? goNext : submit,
    onSkip: skip,
    onBookmark: toggleBookmark
  })

  if (!question) return null

  const progressPercent = Math.round(
    ((currentIndex + 1) / questions.length) * 100
  )

  return (
    <article
      className="border-border bg-card rounded-lg border p-4 pb-24 md:p-6 md:pb-6"
      data-slot="drill-card"
    >
      <header className="mb-4 flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <span className="font-mono text-sm">
            {currentIndex + 1} / {questions.length}
          </span>
          <span
            aria-hidden="true"
            className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full"
          >
            <span
              className="bg-foreground block h-full rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </span>
        </div>
        <Link className="text-muted-foreground text-sm" href={`/${certSlug}`}>
          Exit
        </Link>
      </header>

      <QuestionMeta
        isBookmarked={bookmarkedIds.has(question.id)}
        objective={question.objective}
        timesSeen={question.timesSeen}
        type={question.type}
        onToggleBookmark={toggleBookmark}
      />

      <p className="my-4 text-base leading-relaxed">
        <PromptMarkdown text={question.prompt} />
      </p>

      {question.type === 'FILL_IN' ? (
        <p className="text-muted-foreground">
          Fill-in questions aren't drillable yet.
        </p>
      ) : (
        <ChoiceOptions
          correctLetters={verdict?.correctLetters ?? null}
          isAnswered={verdict !== null}
          options={question.options}
          selectedLetters={selectedLetters}
          type={question.type}
          onToggle={toggle}
        />
      )}

      {verdict && <ExplanationPanel explanation={verdict.explanation} />}

      <div className="bg-background border-border fixed inset-x-0 bottom-0 flex items-center gap-3 border-t p-4 md:static md:mt-6 md:border-0 md:bg-transparent md:p-0">
        {verdict ? (
          <Button className="ml-auto" onClick={goNext}>
            Next question
            <kbd className="text-muted-foreground ml-2 hidden font-mono text-xs md:inline-flex">
              ↵
            </kbd>
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={skip}>
              Skip
              <kbd className="text-muted-foreground ml-2 hidden font-mono text-xs md:inline-flex">
                S
              </kbd>
            </Button>
            <Button
              className="ml-auto"
              disabled={selectedLetters.length === 0 || isSubmitting}
              onClick={submit}
            >
              Submit
              <kbd className="text-primary-foreground/70 ml-2 hidden font-mono text-xs md:inline-flex">
                ↵
              </kbd>
            </Button>
          </>
        )}
      </div>
    </article>
  )
}

export { DrillCard }
