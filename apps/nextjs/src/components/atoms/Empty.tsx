import { cn } from '@/utils/mergeClass'

interface EmptyProps {
  title: string
  description: string
  className?: string
  children?: React.ReactNode
}

const Empty = ({
  title,
  description,
  className,
  children
}: Readonly<EmptyProps>) => (
  <div
    className={cn(
      'border-border bg-card text-muted-foreground flex flex-col gap-2 rounded-lg border p-4',
      className
    )}
    data-slot="empty"
  >
    <p className="text-foreground font-medium">{title}</p>
    <p className="text-sm">{description}</p>
    {children}
  </div>
)

export { Empty }
