import { cn } from '@/utils/mergeClass'

interface MicroLabelProps {
  children: React.ReactNode
  className?: string
}

/* The recurring 9px uppercase mono category marker ("RECOMMENDED NEXT",
   "PROGRESS", "MASTERY"). Deliberately sub-12px: it is never the only carrier
   of its meaning — the real content always sits directly beneath it. */
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
