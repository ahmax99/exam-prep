import { Skeleton, SkeletonRegion } from '@/components/atoms'
import { PageTemplate } from '@/components/layout'

export default function RunsLoading() {
  return (
    <PageTemplate>
      <SkeletonRegion>
        <Skeleton className="h-8 w-40 rounded-[5px]" />
      </SkeletonRegion>
      <SkeletonRegion
        className="border-border bg-card mt-[26px] overflow-hidden rounded-lg border"
        delayMs={120}
      >
        {Array.from({ length: 6 }, (_, index) => (
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
    </PageTemplate>
  )
}
