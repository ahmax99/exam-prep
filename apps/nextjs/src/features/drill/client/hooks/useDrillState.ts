'use client'

import { selectableLetters } from '@/features/drill/lib/answerInput'
import { isSelfGrading as toIsSelfGrading } from '@/features/drill/lib/answerPhase'
import { selectSkippedIndexes } from '@/features/drill/lib/skipped'

import { useDrillAnswers } from './useDrillAnswers'
import { useDrillCursor } from './useDrillCursor'
import { useDrillSubmissions } from './useDrillSubmissions'

interface DrillStateQuestion {
  id: string
  objective: string
  prompt: string
  options: { letter: string; text: string }[]
}

interface UseDrillStateParams<Question extends DrillStateQuestion> {
  runId: string
  questions: Question[]
  startIndex: number
  frontier: number
  answeredQuestionIds: string[]
  onFinish: () => void
}

export const useDrillState = <Question extends DrillStateQuestion>({
  runId,
  questions,
  startIndex,
  frontier,
  answeredQuestionIds,
  onFinish
}: UseDrillStateParams<Question>) => {
  const answers = useDrillAnswers(answeredQuestionIds)
  const cursor = useDrillCursor({
    startIndex,
    frontier,
    questionCount: questions.length,
    onFinish
  })
  const submissions = useDrillSubmissions({
    runId,
    patchQuestionState: answers.patchQuestionState,
    verdictFor: answers.verdictFor
  })

  const { currentIndex } = cursor
  const question = questions[currentIndex]
  const questionState = answers.stateFor(question?.id)
  const phase = answers.phaseFor(question?.id)
  const isAnswered = answers.isRevealed(question?.id)

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

  return {
    answers,
    cursor,
    submissions,
    question,
    questionState,
    isAnswered,
    isAnsweredWithoutDetail: isAnswered && questionState.verdict === null,
    isBlocked: phase === 'awaiting-self-grade',
    isSelfGrading: toIsSelfGrading(questionState),
    canGoPrevious: currentIndex > 0 && phase !== 'awaiting-self-grade',
    activeOptionLetters: selectableLetters(question?.options, isAnswered),
    skippedEntries
  }
}
