import { cva } from 'class-variance-authority'

export const fillInFieldVariants = cva(
  'w-full rounded-md border font-mono transition-colors',
  {
    variants: {
      state: {
        idle: 'border-input bg-card hover:border-foreground/40 focus:border-brand focus:ring-brand/30 min-h-14 px-4 py-3 text-lg focus:ring-[3px] focus:outline-none md:text-xl',
        matched:
          'border-success bg-muted text-prose-foreground min-h-11 px-3.5 py-2 text-[13px] tracking-[-0.04em]',
        /* Card fill, not a warm tint: an amber wash on a cool dark surface
           reads as mud, so the border and ink carry the state alone. */
        'no-match':
          'border-warning-border bg-muted text-prose-foreground min-h-11 px-3.5 py-2 text-[13px] tracking-[-0.04em]',
        wrong:
          'border-destructive bg-muted text-prose-foreground min-h-11 px-3.5 py-2 text-[13px] tracking-[-0.04em]'
      }
    },
    defaultVariants: { state: 'idle' }
  }
)
