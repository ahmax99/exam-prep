import { cva } from 'class-variance-authority'

export const fillInFieldVariants = cva(
  'w-full rounded-lg border bg-card font-mono transition-colors',
  {
    variants: {
      state: {
        // Typing the answer from memory is the whole product thesis, so the
        // unanswered field is the largest, most deliberate element on the
        // surface — scale and border weight, not decoration.
        idle: 'border-input hover:border-foreground/40 focus:border-brand focus:ring-brand/30 min-h-14 px-4 py-3 text-lg focus:ring-[3px] focus:outline-none md:text-xl',
        // Once answered the field turns into a record of what you typed, so
        // it steps back to reference scale and hands emphasis to the verdict.
        matched:
          'border-success bg-success/10 text-muted-foreground min-h-11 px-3 py-2 text-sm',
        'no-match':
          'border-warning bg-warning/10 text-muted-foreground min-h-11 px-3 py-2 text-sm',
        wrong:
          'border-destructive bg-destructive/10 text-muted-foreground min-h-11 px-3 py-2 text-sm'
      }
    },
    defaultVariants: { state: 'idle' }
  }
)
