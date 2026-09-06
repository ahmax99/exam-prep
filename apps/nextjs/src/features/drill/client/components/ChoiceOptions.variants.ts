import { cva } from 'class-variance-authority'

export const choiceOptionVariants = cva(
  'has-[:focus-visible]:border-ring has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:ring-[3px] bg-card flex min-h-14 w-full cursor-pointer items-start gap-3.5 rounded-md text-left transition-[background-color,box-shadow] duration-[130ms] ease-out [transition:border-color_220ms_ease-out,background-color_130ms_ease-out]',
  {
    variants: {
      state: {
        idle: 'border-border hover:bg-muted border px-4 py-[15px]',
        selected: 'border-brand bg-row-active border-2 px-[15px] py-3.5',
        correct: 'border-success bg-success/10 border px-4 py-[15px]',
        incorrect: 'border-destructive bg-destructive/10 border px-4 py-[15px]'
      }
    },
    defaultVariants: {
      state: 'idle'
    }
  }
)

export const choiceLetterVariants = cva(
  'flex size-[26px] shrink-0 items-center justify-center rounded-[3px] border font-mono text-[10px] transition-[background-color,color] duration-[130ms] ease-out',
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
