'use client'

import { useEffect, useRef } from 'react'

import { MicroLabel } from '@/components/atoms'
import type { AnswerVerdict } from '@/features/drill/schemas/answerVerdict.schema'
import { cn } from '@/utils/mergeClass'

import { ExplanationPanel } from './ExplanationPanel'
import { fillInFieldVariants } from './FillInField.variants'
import { PromptMarkdown } from './PromptMarkdown'

interface FillInFieldProps {
  value: string
  verdict: AnswerVerdict | null
  onChange: (value: string) => void
  onSubmit: () => void
}

const verdictToneClasses: Record<AnswerVerdict['verdict'], string> = {
  matched: 'text-success',
  'no-match': 'text-warning',
  wrong: 'text-destructive'
}

const verdictLabels: Record<AnswerVerdict['verdict'], string> = {
  matched: 'Matched an accepted answer — recorded as correct.',
  'no-match':
    "We couldn't match this to an accepted answer. That could mean you had it and phrased it differently, or you missed it — self-grade honestly below.",
  wrong: 'Incorrect'
}

function FillInField({
  value,
  verdict,
  onChange,
  onSubmit
}: Readonly<FillInFieldProps>) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (verdict !== null) inputRef.current?.blur()
  }, [verdict])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    if (verdict !== null || value.trim() === '') return
    onSubmit()
  }

  const revealed = verdict !== null

  return (
    <div data-slot="fill-in-field-container">
      {verdict && (
        <p
          className={cn(
            'animate-om-reveal max-w-[70ch] text-base font-medium',
            verdictToneClasses[verdict.verdict]
          )}
          data-slot="fill-in-verdict"
        >
          {verdictLabels[verdict.verdict]}
        </p>
      )}

      {verdict && verdict.verdict !== 'matched' && verdict.answerDisplay && (
        <div className="border-border animate-om-reveal mt-[22px] border-l-2 pl-[18px]">
          <MicroLabel>Correct answer</MicroLabel>
          <p
            className="mt-2 font-mono text-[22px] leading-snug tracking-[-0.06em]"
            data-slot="fill-in-correct-answer"
          >
            <PromptMarkdown text={verdict.answerDisplay} />
          </p>
        </div>
      )}

      <div className={cn(revealed ? 'animate-om-reveal mt-[22px]' : 'mt-4')}>
        {verdict !== null && <MicroLabel>Your answer</MicroLabel>}
        <input
          ref={inputRef}
          aria-label="Your answer"
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          autoFocus
          className={cn(
            revealed ? 'mt-2' : 'mt-1',
            fillInFieldVariants({ state: verdict?.verdict ?? 'idle' })
          )}
          data-slot="fill-in-field"
          readOnly={verdict !== null}
          spellCheck={false}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {verdict && (
        <div className="animate-om-reveal">
          <ExplanationPanel explanation={verdict.explanation} />
        </div>
      )}
    </div>
  )
}

export { FillInField }
