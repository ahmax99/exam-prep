import { cva } from 'class-variance-authority'

export const masteryChipVariants = cva(
  'inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-xs',
  {
    variants: {
      state: {
        unseen: 'border-border text-muted-foreground',
        WRONG: 'border-destructive text-destructive bg-destructive/10',
        SHAKY: 'border-warning text-warning bg-warning/10',
        MASTERED: 'border-success text-success bg-success/10'
      }
    },
    defaultVariants: { state: 'unseen' }
  }
)
