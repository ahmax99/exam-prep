import { cn } from '@/utils/mergeClass'

interface MicroLabelProps {
  children: React.ReactNode
  className?: string
}

const MicroLabel = ({ children, className }: Readonly<MicroLabelProps>) => (
  <p
    className={cn(
      'text-muted-foreground font-mono text-[9px] font-medium tracking-widest uppercase',
      className
    )}
    data-slot="micro-label"
  >
    {children}
  </p>
)

export { MicroLabel }
