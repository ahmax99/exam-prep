import { cva } from 'class-variance-authority'

export const masteryChipVariants = cva(
  'inline-flex h-5 items-center rounded-full border px-[9px] font-mono text-[9px] tracking-wider',
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
