import { Skeleton, SkeletonRegion } from '@/components/atoms'
import { PageTemplate } from '@/components/layout'

export default function CertificationLoading() {
  return (
    <PageTemplate>
      <SkeletonRegion className="flex flex-col gap-3">
        <Skeleton className="h-10 w-[62%] rounded-[5px]" />
        <Skeleton className="h-[18px] w-[44%] rounded-[4px]" tone="secondary" />
        <Skeleton className="h-[13px] w-[30%]" tone="secondary" />
      </SkeletonRegion>

      <SkeletonRegion
        className="mt-[30px] grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]"
        delayMs={120}
      >
        <Skeleton className="h-[176px] rounded-md" />
        <Skeleton className="h-[176px] rounded-md" tone="secondary" />
      </SkeletonRegion>

      <SkeletonRegion className="mt-[30px] flex flex-col" delayMs={240}>
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="border-row-border flex h-14 items-center gap-5 border-b"
          >
            <Skeleton className="size-2 rounded-full" />
            <Skeleton className="h-3.5 max-w-[340px] flex-1" tone="secondary" />
            <Skeleton className="h-1.5 w-44 rounded-full" tone="secondary" />
            <Skeleton className="h-3 w-[62px]" tone="secondary" />
          </div>
        ))}
      </SkeletonRegion>
    </PageTemplate>
  )
}
