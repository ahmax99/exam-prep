import { cn } from '@/utils/mergeClass'

import { MicroLabel } from './MicroLabel'

interface EmptyProps {
  label: string
  title: string
  description: string
  className?: string
  children?: React.ReactNode
}

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
