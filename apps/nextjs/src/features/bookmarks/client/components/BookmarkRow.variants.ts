import { cva } from 'class-variance-authority'

export const masteryChipVariants = cva(
  'inline-flex h-5 items-center rounded-full border px-[9px] font-mono text-[9px] tracking-wider',
  {
    variants: {
      state: {
        /* Unseen is the absence of a grade rather than one, so it takes a
           plain outline and stays lowercase. */
        unseen: 'border-border text-muted-foreground',
        WRONG: 'border-destructive text-destructive bg-destructive/10',
        SHAKY: 'border-warning text-warning bg-warning/10',
        MASTERED: 'border-success text-success bg-success/10'
      }
    },
    defaultVariants: { state: 'unseen' }
  }
)
