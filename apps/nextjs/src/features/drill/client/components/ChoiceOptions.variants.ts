import { cva } from 'class-variance-authority'

export const choiceOptionVariants = cva(
  // The real <input> is sr-only (1x1px); has-[:focus-visible] promotes its
  // focus ring onto this label, the only element sighted keyboard users see.
  'has-[:focus-visible]:border-ring has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:ring-[3px] flex w-full min-h-12 cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition-colors',
  {
    variants: {
      state: {
        idle: 'border-border hover:border-foreground/30 hover:bg-muted/50',
        // Selection is a decision in progress, so it borrows the accent the
        // rest of the app reserves for the action you are about to take.
        selected: 'border-brand bg-brand/5',
        correct: 'border-success bg-success/10',
        incorrect: 'border-destructive bg-destructive/10'
      }
    },
    defaultVariants: {
      state: 'idle'
    }
  }
)

// The letter is the key you actually press, so it is drawn as a key rather
// than set as a caption.
export const choiceLetterVariants = cva(
  'flex size-6 shrink-0 items-center justify-center rounded-sm border font-mono text-xs',
  {
    variants: {
      state: {
        idle: 'border-border text-muted-foreground',
        selected: 'border-brand bg-brand text-brand-foreground',
        correct: 'border-success bg-success text-success-foreground',
        incorrect:
          'border-destructive bg-destructive text-destructive-foreground'
      }
    },
    defaultVariants: { state: 'idle' }
  }
)
