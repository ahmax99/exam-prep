import { cn } from '@/utils/mergeClass'

import { MicroLabel } from './MicroLabel'

interface EmptyProps {
  /* The mono context marker above the headline — which list this is. */
  label: string
  title: string
  description: string
  className?: string
  children?: React.ReactNode
}

/* Every empty state says what fills the list, not merely that it is empty —
   so the copy reads as a next step rather than a dead end. */
const Empty = ({
  label,
  title,
  description,
  className,
  children
}: Readonly<EmptyProps>) => (
  <div
    className={cn(
      'border-border bg-card rounded-lg border px-7 py-[26px]',
      className
    )}
    data-slot="empty"
  >
    <MicroLabel>{label}</MicroLabel>
    <p className="mt-3.5 text-[17px] font-semibold tracking-tight">{title}</p>
    <p className="text-prose-foreground mt-2 max-w-[56ch] text-[15px] leading-[1.6]">
      {description}
    </p>
    {children}
  </div>
)

export { Empty }
