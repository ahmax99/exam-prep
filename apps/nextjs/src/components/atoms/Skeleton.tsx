import { cn } from '@/utils/mergeClass'

interface SkeletonProps {
  tone?: 'primary' | 'secondary'
  className?: string
}

const Skeleton = ({ tone = 'primary', className }: Readonly<SkeletonProps>) => (
  <span
    className={cn(
      'block rounded-[3px]',
      tone === 'primary' ? 'bg-skeleton' : 'bg-skeleton-muted',
      className
    )}
    data-slot="skeleton"
  />
)

interface SkeletonRegionProps {
  delayMs?: number
  className?: string
  children: React.ReactNode
}

const SkeletonRegion = ({
  delayMs = 0,
  className,
  children
}: Readonly<SkeletonRegionProps>) => (
  <div
    className={cn('animate-om-pulse', className)}
    style={{ animationDelay: `${delayMs}ms` }}
  >
    {children}
  </div>
)

export { Skeleton, SkeletonRegion }
