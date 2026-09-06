import { Skeleton, SkeletonRegion } from '@/components/atoms'
import { PageTemplate } from '@/components/layout'
import { ListRowsSkeleton } from '@/components/molecules'

export default function BookmarksLoading() {
  return (
    <PageTemplate>
      <SkeletonRegion>
        <Skeleton className="h-8 w-72 rounded-[5px]" />
        <Skeleton className="mt-2.5 h-3.5 w-56" tone="secondary" />
      </SkeletonRegion>
      <ListRowsSkeleton />
    </PageTemplate>
  )
}
