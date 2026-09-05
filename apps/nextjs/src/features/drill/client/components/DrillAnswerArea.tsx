'use client'

import type { AnswerVerdict } from '@/features/drill/schemas/answerVerdict.schema'
import type { QuestionType } from '@/lib/prisma'

import { ChoiceOptions } from './ChoiceOptions'
import { ExplanationPanel } from './ExplanationPanel'
import { FillInField } from './FillInField'

interface DrillAnswerAreaProps {
  questionId: string
  type: QuestionType
  options: { letter: string; text: string }[]
  selectedLetters: string[]
  fillInValue: string
  verdict: AnswerVerdict | null
  isAnswered: boolean
  isAnsweredWithoutDetail: boolean
  onToggle: (letter: string) => void
  onFillInChange: (value: string) => void
  onSubmit: () => void
}

function DrillAnswerArea({
  questionId,
  type,
  options,
  selectedLetters,
  fillInValue,
  verdict,
  isAnswered,
  isAnsweredWithoutDetail,
  onToggle,
  onFillInChange,
  onSubmit
}: Readonly<DrillAnswerAreaProps>) {
  if (type === 'FILL_IN') {
    if (isAnsweredWithoutDetail) return null
    return (
      <FillInField
        key={questionId}
        value={fillInValue}
        verdict={verdict}
        onChange={onFillInChange}
        onSubmit={onSubmit}
      />
    )
  }

  return (
    <>
      <ChoiceOptions
        correctLetters={verdict?.correctLetters ?? null}
        isAnswered={isAnswered}
        options={options}
        selectedLetters={selectedLetters}
        type={type}
        onToggle={onToggle}
      />
      {verdict && <ExplanationPanel explanation={verdict.explanation} />}
    </>
  )
}

export { DrillAnswerArea }
