import { cn } from '@/utils/mergeClass'

interface SkeletonProps {
  /* Secondary shapes sit a shade lighter, so a placeholder block reads as
     having a hierarchy rather than as one flat grey mass. */
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
  /* Regions pulse together but start staggered, so the page reads as filling
     in from the top rather than flashing as one block. */
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
