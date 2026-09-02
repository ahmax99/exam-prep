'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { toast } from 'sonner'

import { Button } from '@/components/atoms'
import type { AnswerVerdict } from '@/features/drill/schemas/answerVerdict.schema'
import type { QuestionType } from '@/lib/prisma'

import { useDrillKeys } from '../hooks/useDrillKeys'
import { selfGrade } from '../lib/selfGrade'
import { submitAnswer } from '../lib/submitAnswer'
import { buildVerdictAnnouncement } from '../lib/verdictAnnouncement'

import { ChoiceOptions } from './ChoiceOptions'
import { DrillContextRail } from './DrillContextRail'
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
  isBookmarked: boolean
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
  const bookmarkToggleRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLElement>(null)

  const question = questions[currentIndex]

  // Keeps keyboard control anchored in the card so useDrillKeys' focus-
  // containment gate doesn't silently swallow every shortcut: mount, a
  // Submit -> Next / Y-N -> outcome transition (both unmount the previously
  // focused button, which drops document.activeElement to <body>), and
  // FillInField's own blur-on-answer (a child effect, so it always runs
  // before this one and gets overridden here) all need focus restored to
  // the container. The one exception is an unanswered FILL_IN question:
  // its own autoFocus (set during React's commit phase, before this passive
  // effect runs) owns focus while verdict is still null, and stealing it
  // here would fight that — but once verdict is set the input goes
  // read-only and blurs itself, so the card needs focus back regardless of
  // question type.
  useEffect(() => {
    if (question?.type === 'FILL_IN' && verdict === null) return
    // preventScroll: unlike the old one-shot mount focus (top of page, no
    // visible effect), this now fires after every transition — a long
    // question on mobile can have its Submit/self-grade button below the
    // fold, and a bare .focus() would jump the viewport back to the card.
    containerRef.current?.focus({ preventScroll: true })
  }, [verdict, selfGradeOutcome, question])

  // Self-grading updates verdict too (see submitSelfGrade), so once outcome
  // is set that's the freshest fact — it wins over restating the verdict.
  const liveAnnouncement = selfGradeOutcome
    ? selfGradeOutcome === 'had-it'
      ? 'Recorded: had it.'
      : 'Recorded: missed it.'
    : verdict && question
      ? buildVerdictAnnouncement(question, verdict, selectedLetters)
      : ''

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
        (gradedVerdict) => {
          setSelfGradeOutcome(hadIt ? 'had-it' : 'missed-it')
          // Flips FillInField from the frozen no-match/amber treatment to the
          // graded matched/wrong one — the reveal fields are unchanged from
          // the original no-match response, only the discriminant moves.
          setVerdict((current) =>
            current ? { ...current, verdict: gradedVerdict } : current
          )
        },
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
    containerRef,
    optionLetters: verdict
      ? []
      : (question?.options.map((o) => o.letter) ?? []),
    onLetter: toggle,
    onPrimary: verdict ? (isBlocked ? () => {} : goNext) : submit,
    onSkip: isBlocked ? () => {} : skip,
    // Keyboard and pointer share one handler, so the optimistic state has
    // exactly one owner.
    onBookmark: () => bookmarkToggleRef.current?.click(),
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
    // tabIndex + outline-none: this container is only ever focused
    // programmatically (see the mount effect above), never via Tab — it's
    // not in the tab sequence — so a full-card outline has no keyboard user
    // to show itself to and would just be visual noise.
    <article
      ref={containerRef}
      className="border-border bg-card rounded-lg border p-4 pb-24 outline-none md:p-6 md:pb-6 xl:grid xl:grid-cols-[minmax(0,1fr)_15rem] xl:items-start xl:gap-8"
      data-slot="drill-card"
      tabIndex={-1}
    >
      <div className="min-w-0">
        <h1 className="sr-only">
          Question {currentIndex + 1} of {questions.length}, objective{' '}
          {question.objective}
        </h1>

        <header className="mb-4 flex items-center justify-between gap-4 xl:justify-end">
          <div className="flex flex-1 items-center gap-3 xl:hidden">
            <span aria-hidden="true" className="font-mono text-sm">
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
          initialBookmarked={question.isBookmarked}
          objective={question.objective}
          questionId={question.id}
          timesSeen={question.timesSeen}
          toggleRef={bookmarkToggleRef}
          type={question.type}
        />

        {/* max-w-[75ch]: a hard ceiling on DESIGN.md's 65-75ch body measure,
            independent of the grid math above — protects the prompt column
            from ever exceeding it regardless of viewport or font metrics. */}
        <p className="my-4 max-w-[75ch] text-base leading-relaxed">
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

        {/* Always mounted (content toggles empty/set) — a live region only
            reliably announces a state change if it existed before the change;
            mounting it alongside the verdict text drops the first announcement
            on some screen readers. Covers both the submit verdict and the
            self-grade outcome; see liveAnnouncement above. */}
        <p aria-live="polite" className="sr-only" role="status">
          {liveAnnouncement}
        </p>

        {(verdict?.verdict === 'no-match' || selfGradeOutcome !== null) && (
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
      </div>

      <DrillContextRail
        currentIndex={currentIndex}
        hasOptions={question.options.length > 0}
        isAnswered={verdict !== null}
        isSelfGrading={
          verdict?.verdict === 'no-match' || selfGradeOutcome !== null
        }
        progressPercent={progressPercent}
        questionCount={questions.length}
      />
    </article>
  )
}

export { DrillCard }
