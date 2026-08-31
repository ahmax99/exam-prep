import { cva } from 'class-variance-authority'

export const choiceOptionVariants = cva(
  // The real <input> is sr-only (1x1px); has-[:focus-visible] promotes its
  // focus ring onto this label, the only element sighted keyboard users see.
  'has-[:focus-visible]:border-ring has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:ring-[3px] flex w-full min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-3 text-left',
  {
    variants: {
      state: {
        idle: 'border-border',
        selected: 'border-foreground/40 bg-muted',
        correct: 'border-success bg-success/10',
        incorrect: 'border-destructive bg-destructive/10'
      }
    },
    defaultVariants: {
      state: 'idle'
    }
  }
)
