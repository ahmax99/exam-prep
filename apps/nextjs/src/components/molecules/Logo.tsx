import { cn } from '@/utils/mergeClass'

interface LogoProps {
  className?: string
}

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
