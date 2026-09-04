import { cn } from '@/utils/mergeClass'

interface LogoProps {
  className?: string
}

// No product name has been chosen yet (PRODUCT.md), so the mark is typographic
// rather than a logotype: the existing words in the mono face the rest of the
// app measures in, closed by a terminal block cursor. The cursor is the one
// piece of the identity that carries the accent.
const Logo = ({ className }: Readonly<LogoProps>) => {
  return (
    <div
      className={cn('flex items-center gap-1.5', className)}
      data-slot="logo"
    >
      <span className="font-mono text-base font-medium tracking-tight">
        exam<span className="text-muted-foreground">-</span>prep
      </span>
      <span
        aria-hidden="true"
        className="bg-brand block h-4 w-[0.4rem]"
        data-slot="logo-cursor"
      />
    </div>
  )
}

export { Logo }
