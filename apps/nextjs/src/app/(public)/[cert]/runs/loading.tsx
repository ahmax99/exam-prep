import { Skeleton, SkeletonRegion } from '@/components/atoms'
import { PageTemplate } from '@/components/layout'
import { ListRowsSkeleton } from '@/components/molecules'

export default function RunsLoading() {
  return (
    <PageTemplate>
      <SkeletonRegion>
        <Skeleton className="h-8 w-40 rounded-[5px]" />
      </SkeletonRegion>
      <ListRowsSkeleton />
    </PageTemplate>
  )
}
