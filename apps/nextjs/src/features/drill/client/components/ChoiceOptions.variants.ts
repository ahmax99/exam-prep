import { cva } from 'class-variance-authority'

export const choiceOptionVariants = cva(
  'flex w-full min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-3 text-left',
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
