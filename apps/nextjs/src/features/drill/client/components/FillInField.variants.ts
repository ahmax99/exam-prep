import { cva } from 'class-variance-authority'

export const fillInFieldVariants = cva(
  'w-full min-h-11 rounded-lg border bg-transparent px-3 py-2 font-mono text-base',
  {
    variants: {
      state: {
        idle: 'border-border',
        matched: 'border-success bg-success/10',
        'no-match': 'border-warning bg-warning/10',
        wrong: 'border-destructive bg-destructive/10'
      }
    },
    defaultVariants: { state: 'idle' }
  }
)
