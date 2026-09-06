import { Skeleton, SkeletonRegion } from '@/components/atoms'

interface ListRowsSkeletonProps {
  rows?: number
  delayMs?: number
}

/* The list-rows placeholder shared by the bookmarks and runs screens: both
   are a bordered card of fixed-height rows, so both wait the same way. */
const ListRowsSkeleton = ({
  rows = 6,
  delayMs = 120
}: Readonly<ListRowsSkeletonProps>) => (
  <SkeletonRegion
    className="border-border bg-card mt-[26px] overflow-hidden rounded-lg border"
    delayMs={delayMs}
  >
    {Array.from({ length: rows }, (_, index) => (
      <div
        key={index}
        className="border-row-border flex h-[50px] items-center gap-5 px-6 not-first:border-t"
      >
        <Skeleton className="h-3 w-[150px]" tone="secondary" />
        <Skeleton className="h-3.5 max-w-[260px] flex-1" tone="secondary" />
        <Skeleton className="h-3 w-16" tone="secondary" />
      </div>
    ))}
  </SkeletonRegion>
)

export { ListRowsSkeleton }
