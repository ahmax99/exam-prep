'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { toast } from 'sonner'

import { Button } from '@/components/atoms'
import type { AnswerVerdict } from '@/features/drill/schemas/answerVerdict.schema'
import type { QuestionType } from '@/lib/prisma'

import { useDrillKeys } from '../hooks/useDrillKeys'
import { selfGrade } from '../lib/selfGrade'
import { submitAnswer } from '../lib/submitAnswer'

import { ChoiceOptions } from './ChoiceOptions'
import { ExplanationPanel } from './ExplanationPanel'
import { FillInField } from './FillInField'
import { PromptMarkdown } from './PromptMarkdown'
import { QuestionMeta } from './QuestionMeta'
import { SelfGradePanel } from './SelfGradePanel'

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
  const [fillInValue, setFillInValue] = useState('')
  const [selfGradeOutcome, setSelfGradeOutcome] = useState<
    'had-it' | 'missed-it' | null
  >(null)
  const [isSelfGradeSubmitting, setIsSelfGradeSubmitting] = useState(false)
  // A plain ref, not `isSubmitting` state: two keydown events arriving before
  // React flushes a state update must still see the in-flight request.
  const isSubmittingRef = useRef(false)
  // Same reasoning as isSubmittingRef: a fast double-click/double-key-press
  // on Y/N must see the in-flight self-grade request before React re-renders.
  const isSelfGradeSubmittingRef = useRef(false)

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
    setFillInValue('')
    setSelfGradeOutcome(null)
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

  const submitFillIn = () => {
    if (!question || fillInValue.trim() === '' || isSubmittingRef.current)
      return
    isSubmittingRef.current = true
    setIsSubmitting(true)
    // Raw, untrimmed value — the client never normalizes a fill-in answer.
    submitAnswer({ runId, questionId: question.id, response: fillInValue })
      .match(
        (result) => setVerdict(result),
        (error) => toast.error(error.message)
      )
      .finally(() => {
        isSubmittingRef.current = false
        setIsSubmitting(false)
      })
  }

  const submitSelfGrade = (hadIt: boolean) => {
    if (
      !question ||
      verdict?.verdict !== 'no-match' ||
      selfGradeOutcome !== null ||
      isSelfGradeSubmittingRef.current
    )
      return
    isSelfGradeSubmittingRef.current = true
    setIsSelfGradeSubmitting(true)
    selfGrade({ runId, questionId: question.id, hadIt })
      .match(
        () => setSelfGradeOutcome(hadIt ? 'had-it' : 'missed-it'),
        (error) => toast.error(error.message)
      )
      .finally(() => {
        isSelfGradeSubmittingRef.current = false
        setIsSelfGradeSubmitting(false)
      })
  }

  const skip = () => goNext()

  // Blocks "Next question" until a no-match verdict's self-grade is recorded.
  const isBlocked = verdict?.verdict === 'no-match' && selfGradeOutcome === null

  useDrillKeys({
    optionLetters: verdict
      ? []
      : (question?.options.map((o) => o.letter) ?? []),
    onLetter: toggle,
    onPrimary: verdict ? (isBlocked ? () => {} : goNext) : submit,
    onSkip: skip,
    onBookmark: toggleBookmark,
    onSelfGradeHadIt:
      verdict?.verdict === 'no-match' ? () => submitSelfGrade(true) : undefined,
    onSelfGradeMissedIt:
      verdict?.verdict === 'no-match' ? () => submitSelfGrade(false) : undefined
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
        <FillInField
          // Keyed on question id so React remounts the input (and its
          // autoFocus) per fill-in question, instead of reusing the same
          // DOM node whose focus was already spent on the previous one.
          key={question.id}
          isSubmitting={isSubmitting}
          value={fillInValue}
          verdict={verdict}
          onChange={setFillInValue}
          onSubmit={submitFillIn}
        />
      ) : (
        <>
          <ChoiceOptions
            correctLetters={verdict?.correctLetters ?? null}
            isAnswered={verdict !== null}
            options={question.options}
            selectedLetters={selectedLetters}
            type={question.type}
            onToggle={toggle}
          />
          {verdict && <ExplanationPanel explanation={verdict.explanation} />}
        </>
      )}

      {verdict?.verdict === 'no-match' && (
        <SelfGradePanel
          isSubmitting={isSelfGradeSubmitting}
          outcome={selfGradeOutcome}
          onHadIt={() => submitSelfGrade(true)}
          onMissedIt={() => submitSelfGrade(false)}
        />
      )}

      {!isBlocked && (
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
              {question.type !== 'FILL_IN' && (
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
              )}
            </>
          )}
        </div>
      )}
    </article>
  )
}

export { DrillCard }
