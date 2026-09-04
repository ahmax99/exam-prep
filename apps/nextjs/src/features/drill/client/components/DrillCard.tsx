'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import {
  canSubmitAnswer,
  nextSelection,
  selectableLetters,
  toAnswerResponse
} from '@/features/drill/lib/answerInput'
import type { QuestionType } from '@/lib/prisma'

import { bindShortcuts, boundShortcuts } from '../../lib/shortcuts'
import { selectSkippedIndexes } from '../../lib/skipped'
import { useCardFocus } from '../hooks/useCardFocus'
import { useDrillAnswers } from '../hooks/useDrillAnswers'
import { useDrillCursor } from '../hooks/useDrillCursor'
import { useDrillKeys } from '../hooks/useDrillKeys'
import { useDrillSubmissions } from '../hooks/useDrillSubmissions'
import { buildLiveAnnouncement } from '../lib/verdictAnnouncement'

import { DrillActionBar } from './DrillActionBar'
import { DrillAnswerArea } from './DrillAnswerArea'
import { DrillContextRail } from './DrillContextRail'
import { DrillSubmitError } from './DrillSubmitError'
import { PromptMarkdown } from './PromptMarkdown'
import { QuestionMeta } from './QuestionMeta'
import { SelfGradePanel } from './SelfGradePanel'
import { ShortcutsHelp } from './ShortcutsHelp'
import { SkippedPanel } from './SkippedPanel'

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
  frontier: number
  answeredQuestionIds: string[]
}

function DrillCard({
  runId,
  certSlug,
  questions,
  startIndex,
  frontier,
  answeredQuestionIds
}: Readonly<DrillCardProps>) {
  const router = useRouter()
  const bookmarkToggleRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLElement>(null)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isSkippedOpen, setIsSkippedOpen] = useState(false)

  const answers = useDrillAnswers(answeredQuestionIds)
  const cursor = useDrillCursor({
    startIndex,
    frontier,
    questionCount: questions.length,
    onFinish: () => {
      // This run's mastery writes never remounted the shared app rail (the
      // drill route has no sidebar of its own) — refresh so the rail and the
      // summary page it's about to render both read the finished state.
      router.refresh()
      router.push(`/${certSlug}/drill/${runId}/summary`)
    }
  })
  const submissions = useDrillSubmissions({
    runId,
    patchQuestionState: answers.patchQuestionState,
    verdictFor: answers.verdictFor
  })

  const { currentIndex } = cursor
  const question = questions[currentIndex]
  const { selectedLetters, fillInValue, verdict, selfGradeOutcome } =
    answers.stateFor(question?.id)

  const isAnswered = answers.isRevealed(question?.id)
  const isAnsweredWithoutDetail = isAnswered && verdict === null
  const isSelfGrading =
    verdict?.verdict === 'no-match' || selfGradeOutcome !== null

  // Blocks "Next question" until a no-match verdict's self-grade is recorded.
  const isBlocked = verdict?.verdict === 'no-match' && selfGradeOutcome === null
  const canGoPrevious = currentIndex > 0 && !isBlocked

  const activeOptionLetters = selectableLetters(question?.options, isAnswered)

  const skippedEntries = selectSkippedIndexes(
    questions.map((entry) => entry.id),
    answers.isRecorded,
    cursor.furthestIndex
  ).flatMap((index) => {
    const skipped = questions[index]
    return skipped
      ? [
          {
            index,
            id: skipped.id,
            objective: skipped.objective,
            prompt: skipped.prompt
          }
        ]
      : []
  })

  // Derived once, from the same expressions useDrillKeys is handed, so the
  // legend and the key handler cannot drift apart.
  const shortcuts = boundShortcuts({
    optionLetters: activeOptionLetters,
    isAnswered,
    canGoPrevious,
    isSelfGrading,
    hasSkipped: skippedEntries.length > 0
  })

  useCardFocus({ containerRef, question, verdict, selfGradeOutcome })

  const toggle = (letter: string) => {
    if (verdict !== null || !question) return
    answers.patchQuestionState(question.id, {
      selectedLetters: nextSelection(question.type, selectedLetters, letter)
    })
  }

  const canSubmit = question
    ? canSubmitAnswer(question.type, selectedLetters, fillInValue)
    : false

  const submit = () => {
    if (!question || !canSubmit) return
    submissions.runSubmitAnswer(
      question.id,
      toAnswerResponse(question.type, selectedLetters, fillInValue)
    )
  }

  const submitSelfGrade = (hadIt: boolean) => {
    if (!question || !isBlocked) return
    submissions.runSelfGrade(question.id, hadIt)
  }

  const jumpTo = (index: number) => {
    if (isBlocked) return
    setIsSkippedOpen(false)
    cursor.jumpTo(index)
  }

  useDrillKeys({
    containerRef,
    optionLetters: activeOptionLetters,
    onLetter: toggle,
    // Keyboard and pointer share one handler, so the optimistic state has
    // exactly one owner.
    onBookmark: () => bookmarkToggleRef.current?.click(),
    onHelp: () => setIsHelpOpen(true),
    ...bindShortcuts(
      { isAnswered, isBlocked, canGoPrevious },
      {
        goNext: cursor.goNext,
        submit,
        openSkippedList: () => setIsSkippedOpen(true),
        goPrevious: cursor.goPrevious,
        selfGrade: submitSelfGrade
      }
    )
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
          <SkippedPanel
            currentIndex={currentIndex}
            entries={skippedEntries}
            isDisabled={isBlocked}
            isOpen={isSkippedOpen}
            questionCount={questions.length}
            onJump={jumpTo}
            onOpenChange={setIsSkippedOpen}
          />
          <ShortcutsHelp
            isOpen={isHelpOpen}
            shortcuts={shortcuts}
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

        <DrillAnswerArea
          fillInValue={fillInValue}
          isAnswered={isAnswered}
          isAnsweredWithoutDetail={isAnsweredWithoutDetail}
          options={question.options}
          questionId={question.id}
          selectedLetters={selectedLetters}
          type={question.type}
          verdict={verdict}
          onFillInChange={(value) =>
            answers.patchQuestionState(question.id, { fillInValue: value })
          }
          onSubmit={submit}
          onToggle={toggle}
        />

        {/* Always mounted (content toggles empty/set) — a live region only
            reliably announces a state change if it existed before the change;
            mounting it alongside the verdict text drops the first announcement
            on some screen readers. Covers both the submit verdict and the
            self-grade outcome. */}
        <p aria-live="polite" className="sr-only" role="status">
          {buildLiveAnnouncement({
            question,
            verdict,
            selfGradeOutcome,
            selectedLetters,
            hasNavigated: cursor.hasNavigated,
            position: `Question ${currentIndex + 1} of ${questions.length}.`
          })}
        </p>

        {isSelfGrading && (
          <SelfGradePanel
            isSubmitting={submissions.isSelfGradeSubmitting}
            outcome={selfGradeOutcome}
            onHadIt={() => submitSelfGrade(true)}
            onMissedIt={() => submitSelfGrade(false)}
          />
        )}

        {submissions.failedSubmit?.questionId === question.id && (
          <DrillSubmitError
            isRetrying={
              submissions.isSubmitting || submissions.isSelfGradeSubmitting
            }
            kind={submissions.failedSubmit.kind}
            onRetry={submissions.retryFailedSubmit}
          />
        )}

        <DrillActionBar
          canSubmit={canSubmit}
          isBlocked={isBlocked}
          isSubmitting={submissions.isSubmitting}
          mode={isAnswered ? 'next' : 'answer'}
          onNext={cursor.goNext}
          onPrevious={canGoPrevious ? cursor.goPrevious : undefined}
          onSkip={cursor.goNext}
          onSubmit={submit}
        />
      </div>

      <DrillContextRail
        currentIndex={currentIndex}
        progressPercent={progressPercent}
        questionCount={questions.length}
        shortcuts={shortcuts}
      />
    </article>
  )
}

export { DrillCard }
