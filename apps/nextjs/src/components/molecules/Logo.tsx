import { cn } from '@/utils/mergeClass'

interface LogoProps {
  className?: string
}

const Logo = ({ className }: Readonly<LogoProps>) => {
  return (
    <div className={cn('flex items-center gap-2', className)} data-slot="logo">
      <span className="font-mono text-xs font-medium tracking-[-0.04em] lg:text-[13px]">
        exam<span className="text-muted-foreground">-</span>prep
      </span>
      {/* The cursor block is one of the five places the action colour is
          allowed to appear. */}
      <span
        aria-hidden="true"
        className="bg-brand block h-3.5 w-1.5 lg:h-[15px] lg:w-[7px]"
        data-slot="logo-cursor"
      />
    </div>
  )
}

export { Logo }
