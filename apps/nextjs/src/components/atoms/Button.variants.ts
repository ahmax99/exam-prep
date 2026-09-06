import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-[4px] border border-transparent bg-clip-padding text-[15px] font-medium focus-visible:ring-[3px] aria-invalid:ring-[3px] [&_svg:not([class*='size-'])]:size-4 inline-flex items-center justify-center whitespace-nowrap transition-colors duration-[160ms] ease-out disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none cursor-pointer",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        brand:
          'bg-brand border-brand text-brand-foreground font-semibold hover:bg-brand/90',
        'on-brand':
          'bg-brand-foreground text-accent-foreground font-semibold hover:bg-brand-foreground/90',
        outline:
          'border-outline bg-transparent text-foreground hover:bg-muted aria-expanded:bg-muted',
        'outline-brand':
          'border-brand bg-transparent text-accent-foreground hover:bg-accent',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
        ghost:
          'text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground',
        destructive:
          'bg-destructive/10 hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/20 text-destructive focus-visible:border-destructive/40 dark:hover:bg-destructive/30',
        link: 'text-brand underline-offset-4 hover:underline'
      },
      size: {
        default: 'min-h-11 gap-3 px-[22px]',
        xs: "min-h-11 gap-2 px-3 text-[13px] [&_svg:not([class*='size-'])]:size-3.5",
        sm: 'h-9 gap-2 px-4 text-[13px]',
        lg: "min-h-[46px] gap-2.5 px-7 [&_svg:not([class*='size-'])]:size-[18px]",
        icon: 'min-h-11 min-w-11 px-0',
        'icon-sm': 'size-9 px-0',
        'icon-lg': 'min-h-11 min-w-11 px-0 [&_svg]:size-5'
      }
    },
    compoundVariants: [
      { variant: 'ghost', size: 'default', class: 'gap-2.5 px-4' },
      { variant: 'link', size: 'default', class: 'min-h-0 gap-2 px-0' }
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)
