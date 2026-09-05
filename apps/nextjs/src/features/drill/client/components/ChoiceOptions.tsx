'use client'

import type { QuestionType } from '@/lib/prisma'
import { cn } from '@/utils/mergeClass'

import {
  choiceLetterVariants,
  choiceOptionVariants
} from './ChoiceOptions.variants'
import { PromptMarkdown } from './PromptMarkdown'

interface ChoiceOption {
  letter: string
  text: string
}

interface ChoiceOptionsProps {
  options: ChoiceOption[]
  type: Extract<QuestionType, 'SINGLE_ANSWER' | 'MULTIPLE_ANSWER'>
  selectedLetters: string[]
  correctLetters: string[] | null
  isAnswered: boolean
  onToggle: (letter: string) => void
}

const resolveState = (params: {
  letter: string
  isSelected: boolean
  isAnswered: boolean
  correctLetters: Set<string> | null
}) => {
  if (!params.isAnswered) return params.isSelected ? 'selected' : 'idle'
  if (params.correctLetters?.has(params.letter)) return 'correct'
  if (params.isSelected) return 'incorrect'
  return 'idle'
}

function ChoiceOptions({
  options,
  type,
  selectedLetters,
  correctLetters,
  isAnswered,
  onToggle
}: Readonly<ChoiceOptionsProps>) {
  const isSingle = type === 'SINGLE_ANSWER'
  const selectedSet = new Set(selectedLetters)
  const correctSet = correctLetters ? new Set(correctLetters) : null

  return (
    <div
      aria-label="Answer options"
      className="flex flex-col gap-2"
      data-slot="choice-options"
      role={isSingle ? 'radiogroup' : 'group'}
    >
      {options.map(({ letter, text }) => {
        const isSelected = selectedSet.has(letter)
        const state = resolveState({
          letter,
          isSelected,
          isAnswered,
          correctLetters: correctSet
        })

        return (
          <label key={letter} className={cn(choiceOptionVariants({ state }))}>
            <input
              checked={isSelected}
              className="sr-only"
              disabled={isAnswered}
              name={isSingle ? 'drill-option' : undefined}
              type={isSingle ? 'radio' : 'checkbox'}
              onChange={() => onToggle(letter)}
            />
            {}
            <span className={cn(choiceLetterVariants({ state }))}>
              {letter}
            </span>
            <span className="min-w-0 flex-1 text-base leading-relaxed">
              <PromptMarkdown text={text} />
            </span>
            {state === 'correct' && (
              <span className="text-success shrink-0 text-sm font-medium">
                Correct answer
              </span>
            )}
            {state === 'incorrect' && (
              <span className="text-destructive shrink-0 text-sm font-medium">
                Your answer
              </span>
            )}
          </label>
        )
      })}
    </div>
  )
}

export { ChoiceOptions }
