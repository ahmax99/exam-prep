import { Skeleton, SkeletonRegion } from '@/components/atoms'
import { PageTemplate } from '@/components/layout'
import { RecommendedDrillSkeleton } from '@/features/drill/server/components/RecommendedDrillSkeleton'

const OBJECTIVE_ROWS = [0, 1, 2, 3, 4]
const STAT_CELLS = [0, 1, 2, 3]

export default function HomeLoading() {
  return (
    <PageTemplate>
      <SkeletonRegion className="max-w-[24ch]">
        <div className="flex h-[32.4px] items-center lg:h-[47.52px]">
          <Skeleton className="h-6 w-full rounded-[5px] lg:h-[33px]" />
        </div>
        <div className="flex h-[32.4px] items-center lg:h-[47.52px]">
          <Skeleton className="h-6 w-[62%] rounded-[5px] lg:h-[33px]" />
        </div>
      </SkeletonRegion>

      <SkeletonRegion className="mt-4 max-w-[62ch]" delayMs={120}>
        <div className="flex h-[25.5px] items-center">
          <Skeleton
            className="h-[17px] w-full rounded-[3px]"
            tone="secondary"
          />
        </div>
        <div className="flex h-[25.5px] items-center">
          <Skeleton
            className="h-[17px] w-full rounded-[3px]"
            tone="secondary"
          />
        </div>
        <div className="flex h-[25.5px] items-center lg:hidden">
          <Skeleton
            className="h-[17px] w-[46%] rounded-[3px]"
            tone="secondary"
          />
        </div>
      </SkeletonRegion>

      <SkeletonRegion className="mt-8" delayMs={240}>
        <RecommendedDrillSkeleton />
      </SkeletonRegion>

      <SkeletonRegion
        className="border-border bg-card mt-5 rounded-lg border px-7 py-6"
        delayMs={360}
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
          <div className="flex h-[25.5px] items-center">
            <Skeleton className="h-[17px] w-[212px] rounded-[3px]" />
          </div>
          <div className="flex h-5 items-center">
            <Skeleton className="h-[14px] w-[184px]" tone="secondary" />
          </div>
        </div>

        <div className="mt-[18px] flex h-[26px] items-center gap-[18px]">
          <Skeleton className="h-[22px] w-[50px] rounded-[3px]" />
          <Skeleton className="h-2 flex-1 rounded-full" tone="secondary" />
        </div>

        <div className="border-row-border mt-[18px] grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-4">
          {STAT_CELLS.map((cell) => (
            <div key={cell}>
              <div className="flex h-4 items-center gap-[7px]">
                <Skeleton
                  className="size-1.5 shrink-0 rounded-full"
                  tone="secondary"
                />
                <Skeleton className="h-2.5 w-[62px]" tone="secondary" />
              </div>
              <div className="mt-[5px] flex h-5 items-center">
                <Skeleton className="h-[13px] w-7" tone="secondary" />
              </div>
            </div>
          ))}
        </div>
      </SkeletonRegion>

      <SkeletonRegion className="mt-[52px]" delayMs={480}>
        <div className="flex h-7 items-center">
          <Skeleton className="h-[19px] w-[184px] rounded-[4px]" />
        </div>
        <div className="border-border bg-card mt-3.5 overflow-hidden rounded-lg border">
          <div className="bg-table-header border-border hidden h-10 items-center gap-[18px] border-b px-[22px] sm:flex">
            <span className="w-2" />
            <div className="w-14">
              <Skeleton className="h-2 w-[22px]" tone="secondary" />
            </div>
            <div className="flex-1">
              <Skeleton className="h-2 w-[38px]" tone="secondary" />
            </div>
            <div className="w-28">
              <Skeleton className="h-2 w-[52px]" tone="secondary" />
            </div>
            <div className="w-12">
              <Skeleton className="ml-auto h-2 w-[46px]" tone="secondary" />
            </div>
          </div>
          {OBJECTIVE_ROWS.map((row) => (
            <div
              className="border-row-border flex min-h-14 flex-wrap items-center gap-x-[18px] gap-y-2.5 px-[22px] py-3 not-first:border-t sm:flex-nowrap sm:py-0"
              key={row}
            >
              <Skeleton className="size-2 shrink-0 rounded-full" />
              <Skeleton className="h-[11px] w-14 shrink-0" tone="secondary" />
              <div className="flex h-[22.5px] min-w-0 flex-1 items-center">
                <Skeleton
                  className="h-[15px] w-full max-w-[300px]"
                  tone="secondary"
                />
              </div>
              <Skeleton
                className="order-last h-1.5 w-full rounded-full sm:order-none sm:w-28"
                tone="secondary"
              />
              <Skeleton className="h-[11px] w-12 shrink-0" tone="secondary" />
            </div>
          ))}
        </div>
      </SkeletonRegion>
    </PageTemplate>
  )
}
