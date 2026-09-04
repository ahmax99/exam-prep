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
import { ShortcutsHelp } from './ShortcutsHelp'

interface DrillQuestion {
  id: string
  objective: string
  topic: string
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
  answeredQuestionIds: string[]
}

interface QuestionState {
  selectedLetters: string[]
  fillInValue: string
  verdict: AnswerVerdict | null
  selfGradeOutcome: 'had-it' | 'missed-it' | null
}

const EMPTY_QUESTION_STATE: QuestionState = {
  selectedLetters: [],
  fillInValue: '',
  verdict: null,
  selfGradeOutcome: null
}

type FailedSubmit =
  | { kind: 'answer'; questionId: string; response: string | string[] }
  | { kind: 'self-grade'; questionId: string; hadIt: boolean }

const SUBMIT_ERROR_MESSAGES: Record<FailedSubmit['kind'], string> = {
  answer: "We couldn't save your answer. Nothing was recorded — try again.",
  'self-grade': "We couldn't record how you graded yourself. Try again."
}

function DrillCard({
  runId,
  certSlug,
  questions,
  startIndex,
  answeredQuestionIds
}: Readonly<DrillCardProps>) {
  const router = useRouter()
  // startIndex is read once: a route param change (new runId) remounts this
  // whole page tree, so the prop never changes under a live instance.
  const [currentIndex, setCurrentIndex] = useState(startIndex)
  // Keyed by question id, not index: a run's questionIds are unique and
  // frozen, so the id is the stable identity across backward navigation.
  const [stateById, setStateById] = useState<Record<string, QuestionState>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSelfGradeSubmitting, setIsSelfGradeSubmitting] = useState(false)
  const [failedSubmit, setFailedSubmit] = useState<FailedSubmit | null>(null)
  // Suppresses the live-region announcement on mount; only a real
  // forward/backward navigation should announce anything.
  const [hasNavigated, setHasNavigated] = useState(false)
  // A plain ref, not `isSubmitting` state: two keydown events arriving before
  // React flushes a state update must still see the in-flight request.
  const isSubmittingRef = useRef(false)
  // Same reasoning as isSubmittingRef: a fast double-click/double-key-press
  // on Y/N must see the in-flight self-grade request before React re-renders.
  const isSelfGradeSubmittingRef = useRef(false)
  const bookmarkToggleRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLElement>(null)
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  const question = questions[currentIndex]
  const { selectedLetters, fillInValue, verdict, selfGradeOutcome } =
    stateById[question?.id ?? ''] ?? EMPTY_QUESTION_STATE

  // Attempts written before this card mounted (a resumed run): the server has
  // them, the client never received their verdicts, and getRun deliberately
  // withholds the reveal fields — so these are review-only with no detail.
  // No useMemo: React Compiler (reactCompiler: true) auto-memoizes this.
  const answeredBeforeMount = new Set(answeredQuestionIds)
  const isAnswered =
    verdict !== null ||
    (question ? answeredBeforeMount.has(question.id) : false)
  const isAnsweredWithoutDetail = isAnswered && verdict === null

  // Blocks "Next question" until a no-match verdict's self-grade is recorded.
  const isBlocked = verdict?.verdict === 'no-match' && selfGradeOutcome === null
  const canGoPrevious = currentIndex > 0 && !isBlocked

  // The one expression both the key handler and the legend read, so a
  // shortcut can never be advertised without being bound (and vice versa).
  const activeOptionLetters = isAnswered
    ? []
    : (question?.options.map((o) => o.letter) ?? [])

  const patchQuestionState = (
    questionId: string,
    patch: Partial<QuestionState>
  ) =>
    setStateById((current) => ({
      ...current,
      [questionId]: {
        ...(current[questionId] ?? EMPTY_QUESTION_STATE),
        ...patch
      }
    }))

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

  // Self-grading updates verdict too (see runSelfGrade), so once outcome
  // is set that's the freshest fact — it wins over restating the verdict.
  const liveAnnouncement = selfGradeOutcome
    ? selfGradeOutcome === 'had-it'
      ? 'Recorded: had it.'
      : 'Recorded: missed it.'
    : verdict && question
      ? buildVerdictAnnouncement(question, verdict, selectedLetters)
      : hasNavigated
        ? `Question ${currentIndex + 1} of ${questions.length}.`
        : ''

  const toggle = (letter: string) => {
    if (verdict !== null || !question) return
    const next =
      question.type === 'SINGLE_ANSWER'
        ? [letter]
        : selectedLetters.includes(letter)
          ? selectedLetters.filter((selected) => selected !== letter)
          : [...selectedLetters, letter]
    patchQuestionState(question.id, { selectedLetters: next })
  }

  const goNext = () => {
    setHasNavigated(true)
    if (currentIndex + 1 >= questions.length) {
      // This run's mastery writes never remounted the shared app rail (the
      // drill route has no sidebar of its own) — refresh so the rail and
      // the summary page it's about to render both read the finished state.
      router.refresh()
      router.push(`/${certSlug}/drill/${runId}/summary`)
      return
    }
    setCurrentIndex((current) => current + 1)
  }

  const goPrevious = () => {
    if (!canGoPrevious) return
    setHasNavigated(true)
    setCurrentIndex((current) => current - 1)
  }

  const runSubmitAnswer = (questionId: string, response: string | string[]) => {
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    setIsSubmitting(true)
    setFailedSubmit(null)
    submitAnswer({ runId, questionId, response })
      .match(
        (result) => patchQuestionState(questionId, { verdict: result }),
        (error) => {
          setFailedSubmit({ kind: 'answer', questionId, response })
          toast.error(error.message)
        }
      )
      .finally(() => {
        isSubmittingRef.current = false
        setIsSubmitting(false)
      })
  }

  const isFillIn = question?.type === 'FILL_IN'
  const canSubmit = isFillIn
    ? fillInValue.trim() !== ''
    : selectedLetters.length > 0

  const submit = () => {
    if (!question || !canSubmit) return
    // Raw, untrimmed value — the client never normalizes a fill-in answer.
    const response = isFillIn
      ? fillInValue
      : question.type === 'SINGLE_ANSWER'
        ? (selectedLetters[0] ?? '')
        : selectedLetters
    runSubmitAnswer(question.id, response)
  }

  const runSelfGrade = (questionId: string, hadIt: boolean) => {
    if (isSelfGradeSubmittingRef.current) return
    isSelfGradeSubmittingRef.current = true
    setIsSelfGradeSubmitting(true)
    setFailedSubmit(null)
    // Captured now, not read fresh at resolve time — the async gap must not
    // let a navigation-driven state change land on the wrong verdict object.
    const capturedVerdict = stateById[questionId]?.verdict ?? null
    selfGrade({ runId, questionId, hadIt })
      .match(
        (gradedVerdict) => {
          patchQuestionState(questionId, {
            selfGradeOutcome: hadIt ? 'had-it' : 'missed-it',
            // Flips FillInField from the frozen no-match/amber treatment to
            // the graded matched/wrong one — the reveal fields are unchanged
            // from the original no-match response, only the discriminant
            // moves.
            verdict: capturedVerdict
              ? { ...capturedVerdict, verdict: gradedVerdict }
              : capturedVerdict
          })
        },
        (error) => {
          setFailedSubmit({ kind: 'self-grade', questionId, hadIt })
          toast.error(error.message)
        }
      )
      .finally(() => {
        isSelfGradeSubmittingRef.current = false
        setIsSelfGradeSubmitting(false)
      })
  }

  const submitSelfGrade = (hadIt: boolean) => {
    if (
      !question ||
      verdict?.verdict !== 'no-match' ||
      selfGradeOutcome !== null
    )
      return
    runSelfGrade(question.id, hadIt)
  }

  const retryFailedSubmit = () => {
    if (!failedSubmit) return
    if (failedSubmit.kind === 'answer')
      runSubmitAnswer(failedSubmit.questionId, failedSubmit.response)
    else runSelfGrade(failedSubmit.questionId, failedSubmit.hadIt)
  }

  const skip = () => goNext()

  useDrillKeys({
    containerRef,
    optionLetters: activeOptionLetters,
    onLetter: toggle,
    onPrimary: isAnswered ? (isBlocked ? () => {} : goNext) : submit,
    onSkip: isBlocked ? () => {} : skip,
    // Keyboard and pointer share one handler, so the optimistic state has
    // exactly one owner.
    onBookmark: () => bookmarkToggleRef.current?.click(),
    onSelfGradeHadIt:
      verdict?.verdict === 'no-match' ? () => submitSelfGrade(true) : undefined,
    onSelfGradeMissedIt:
      verdict?.verdict === 'no-match'
        ? () => submitSelfGrade(false)
        : undefined,
    onPrevious: canGoPrevious ? goPrevious : undefined,
    onHelp: () => setIsHelpOpen(true)
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
      className="border-border bg-card rounded-xl border p-4 pb-24 outline-none md:p-8 md:pb-8 xl:grid xl:grid-cols-[minmax(0,1fr)_15rem] xl:items-start xl:gap-10"
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
              className="bg-secondary h-1.5 flex-1 overflow-hidden rounded-full"
            >
              <span
                className="bg-brand block h-full rounded-full transition-[width] duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </span>
          </div>
          <ShortcutsHelp
            canGoPrevious={canGoPrevious}
            isAnswered={isAnswered}
            isOpen={isHelpOpen}
            isSelfGrading={
              verdict?.verdict === 'no-match' || selfGradeOutcome !== null
            }
            optionLetters={activeOptionLetters}
            onOpenChange={setIsHelpOpen}
          />
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
          topic={question.topic}
          type={question.type}
        />

        {/* The question is the entire reason this surface exists and has
            nothing to compete with, so it carries the page at display scale.
            max-w-[65ch]: a hard ceiling on DESIGN.md's 65-75ch measure at the
            larger size, independent of the grid math above. */}
        <p className="mt-6 mb-8 max-w-[65ch] text-xl leading-snug font-medium md:text-2xl">
          <PromptMarkdown text={question.prompt} />
        </p>

        {isAnsweredWithoutDetail && (
          <p
            className="text-muted-foreground my-4 text-sm"
            data-slot="drill-earlier-answer"
          >
            You answered this earlier in this run. Your answer isn&apos;t shown
            here.
          </p>
        )}

        {question.type === 'FILL_IN' ? (
          !isAnsweredWithoutDetail && (
            <FillInField
              // Keyed on question id so React remounts the input (and its
              // autoFocus) per fill-in question, instead of reusing the same
              // DOM node whose focus was already spent on the previous one.
              key={question.id}
              value={fillInValue}
              verdict={verdict}
              onChange={(value) =>
                patchQuestionState(question.id, { fillInValue: value })
              }
              onSubmit={submit}
            />
          )
        ) : (
          <>
            <ChoiceOptions
              correctLetters={verdict?.correctLetters ?? null}
              isAnswered={isAnswered}
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

        {failedSubmit?.questionId === question.id && (
          <div
            className="border-destructive/40 bg-destructive/10 text-destructive mt-4 flex items-center gap-3 rounded-lg border p-3 text-sm"
            data-slot="drill-submit-error"
            role="alert"
          >
            <p className="flex-1">{SUBMIT_ERROR_MESSAGES[failedSubmit.kind]}</p>
            <Button
              disabled={isSubmitting || isSelfGradeSubmitting}
              size="sm"
              variant="destructive"
              onClick={retryFailedSubmit}
            >
              Retry
            </Button>
          </div>
        )}

        <div
          className="bg-background border-border fixed inset-x-0 bottom-0 flex items-center gap-3 border-t p-4 md:static md:mt-6 md:border-0 md:bg-transparent md:p-0"
          data-slot="drill-action-bar"
        >
          {canGoPrevious && (
            <Button variant="ghost" onClick={goPrevious}>
              Previous
              <kbd className="text-muted-foreground ml-2 hidden font-mono text-xs md:inline-flex">
                ⌫
              </kbd>
            </Button>
          )}
          {isAnswered ? (
            <Button
              className="ml-auto"
              disabled={isBlocked}
              // Blocked pending a self-grade: a washed-out accent button reads
              // as broken, so it steps back to outline until it can be used.
              variant={isBlocked ? 'outline' : 'brand'}
              onClick={goNext}
            >
              Next question
              <kbd className="text-muted-foreground ml-2 hidden font-mono text-xs md:inline-flex">
                ↵
              </kbd>
            </Button>
          ) : (
            <>
              <Button disabled={isBlocked} variant="ghost" onClick={skip}>
                Skip
                <kbd className="text-muted-foreground ml-2 hidden font-mono text-xs md:inline-flex">
                  S
                </kbd>
              </Button>
              <Button
                className="ml-auto"
                disabled={!canSubmit || isSubmitting}
                variant="brand"
                onClick={submit}
              >
                Submit
                <kbd className="text-brand-foreground/70 ml-2 hidden font-mono text-xs md:inline-flex">
                  ↵
                </kbd>
              </Button>
            </>
          )}
        </div>
      </div>

      <DrillContextRail
        canGoPrevious={canGoPrevious}
        currentIndex={currentIndex}
        isAnswered={isAnswered}
        isSelfGrading={
          verdict?.verdict === 'no-match' || selfGradeOutcome !== null
        }
        optionLetters={activeOptionLetters}
        progressPercent={progressPercent}
        questionCount={questions.length}
      />
    </article>
  )
}

export { DrillCard }
