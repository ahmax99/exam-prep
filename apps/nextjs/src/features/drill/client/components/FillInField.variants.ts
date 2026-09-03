import { cva } from 'class-variance-authority'

export const fillInFieldVariants = cva(
  'w-full min-h-11 rounded-lg border bg-card px-3 py-2 font-mono',
  {
    variants: {
      state: {
        idle: 'border-border text-foreground text-base',
        matched: 'border-success bg-success/10 text-muted-foreground text-sm',
        'no-match':
          'border-warning bg-warning/10 text-muted-foreground text-sm',
        wrong:
          'border-destructive bg-destructive/10 text-muted-foreground text-sm'
      }
    },
    defaultVariants: { state: 'idle' }
  }
)
