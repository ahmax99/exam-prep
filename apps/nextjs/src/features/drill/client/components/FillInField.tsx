'use client'

import { useEffect, useRef } from 'react'

import { Button } from '@/components/atoms'
import type { AnswerVerdict } from '@/features/drill/schemas/answerVerdict.schema'
import { cn } from '@/utils/mergeClass'

import { ExplanationPanel } from './ExplanationPanel'
import { fillInFieldVariants } from './FillInField.variants'
import { PromptMarkdown } from './PromptMarkdown'

interface FillInFieldProps {
  value: string
  verdict: AnswerVerdict | null
  isSubmitting: boolean
  onChange: (value: string) => void
  onSubmit: () => void
}

const verdictLabels: Record<AnswerVerdict['verdict'], string> = {
  matched: 'Matched',
  'no-match': 'No match — did you have it?',
  wrong: 'Incorrect'
}

function FillInField({
  value,
  verdict,
  isSubmitting,
  onChange,
  onSubmit
}: Readonly<FillInFieldProps>) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Hands keyboard control back to useDrillKeys's global handler once
  // answered: isTextEntryTarget only ignores a *focused* text input.
  useEffect(() => {
    if (verdict !== null) inputRef.current?.blur()
  }, [verdict])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    if (verdict !== null || value.trim() === '') return
    onSubmit()
  }

  return (
    <div data-slot="fill-in-field-container">
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          aria-label="Your answer"
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          autoFocus
          className={cn(
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
        <Button
          disabled={verdict !== null || value.trim() === '' || isSubmitting}
          onClick={onSubmit}
        >
          Submit
        </Button>
      </div>

      {verdict?.verdict !== 'matched' && verdict?.answerDisplay && (
        <p className="text-muted-foreground mt-2 text-sm">
          <PromptMarkdown text={verdict.answerDisplay} />
        </p>
      )}

      {verdict && (
        <p className="mt-2 text-sm font-medium">
          {verdictLabels[verdict.verdict]}
        </p>
      )}

      {verdict && <ExplanationPanel explanation={verdict.explanation} />}
    </div>
  )
}

export { FillInField }
