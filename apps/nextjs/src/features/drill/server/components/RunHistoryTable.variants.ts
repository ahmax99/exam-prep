import { cva } from 'class-variance-authority'

export const historyDeltaVariants = cva('', {
  variants: {
    direction: {
      up: 'text-success',
      down: 'text-destructive',
      even: 'text-muted-foreground',
      none: 'text-muted-foreground'
    }
  },
  defaultVariants: { direction: 'none' }
})
