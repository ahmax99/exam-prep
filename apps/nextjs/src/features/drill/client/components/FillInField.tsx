'use client'

import { useEffect, useRef } from 'react'

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

  return (
    <div data-slot="fill-in-field-container">
      {verdict && (
        <p
          className={cn(
            'max-w-[70ch] text-base font-medium',
            verdictToneClasses[verdict.verdict]
          )}
          data-slot="fill-in-verdict"
        >
          {verdictLabels[verdict.verdict]}
        </p>
      )}

      {verdict && verdict.verdict !== 'matched' && verdict.answerDisplay && (
        <div className="border-border mt-4 border-l pl-4">
          <p className="text-muted-foreground text-sm">Correct answer</p>
          <p
            className="mt-1 font-mono text-xl leading-snug font-medium md:text-2xl"
            data-slot="fill-in-correct-answer"
          >
            <PromptMarkdown text={verdict.answerDisplay} />
          </p>
        </div>
      )}

      <div className="mt-4">
        {verdict !== null && (
          <p className="text-muted-foreground text-sm">Your answer</p>
        )}
        <input
          ref={inputRef}
          aria-label="Your answer"
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          autoFocus
          className={cn(
            'mt-1',
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

      {verdict && <ExplanationPanel explanation={verdict.explanation} />}
    </div>
  )
}

export { FillInField }
