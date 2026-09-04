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

  // Hands keyboard control back to useDrillKeys's global handler once
  // answered: isTextEntryTarget only ignores a *focused* text input.
  useEffect(() => {
    if (verdict !== null) inputRef.current?.blur()
  }, [verdict])

  // Backstops the `autoFocus` attribute below on every mount (including a
  // remount when goNext advances to the next FILL_IN question, via
  // key={question.id}). Real navigation is the case that needs it: Next.js's
  // App Router refocuses the page's <main> landmark after every navigation
  // (layout-router.js's scroll-and-focus handler), which runs after the DOM
  // commit but before passive effects — so it wins the race against
  // `autoFocus` and leaves focus stranded on <main>. A passive effect fires
  // after that handler, so it reclaims focus for the input every time; on a
  // plain in-page advance it's just a harmless no-op reassertion.
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

      {/* The answer you did not have is the thing you came here to learn, so
          it gets the scale the input had before it was answered. */}
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
