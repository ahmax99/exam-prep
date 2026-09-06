import { Skeleton, SkeletonRegion } from '@/components/atoms'

export default function DrillLoading() {
  return (
    <main className="px-4 py-6 lg:px-10 lg:py-14">
      <div className="mx-auto w-full max-w-[1072px]">
        <div className="border-border bg-card rounded-lg border p-4 md:p-10 xl:grid xl:grid-cols-[minmax(0,1fr)_240px] xl:items-start xl:gap-12">
          <SkeletonRegion className="min-w-0">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-[22px] w-14 rounded-[3px]" />
              <Skeleton className="h-3.5 w-48" tone="secondary" />
            </div>
            <Skeleton className="mt-[26px] h-9 w-[80%] rounded-[5px]" />
            <Skeleton
              className="mt-3 h-9 w-[55%] rounded-[5px]"
              tone="secondary"
            />
            <div className="mt-8 flex flex-col gap-2.5">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton
                  key={index}
                  className="h-14 rounded-md"
                  tone="secondary"
                />
              ))}
            </div>
          </SkeletonRegion>

          <SkeletonRegion
            className="border-border hidden border-l pl-8 xl:block"
            delayMs={120}
          >
            <Skeleton className="h-2.5 w-20" tone="secondary" />
            <Skeleton className="mt-3 h-8 w-24 rounded-[4px]" />
            <Skeleton
              className="mt-3.5 h-1.5 w-full rounded-full"
              tone="secondary"
            />
          </SkeletonRegion>
        </div>
      </div>
    </main>
  )
}
