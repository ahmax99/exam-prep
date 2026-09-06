import { Skeleton, SkeletonRegion } from '@/components/atoms'
import { PageTemplate } from '@/components/layout'
import { RecommendedDrillSkeleton } from '@/features/drill/server/components/RecommendedDrillSkeleton'

const EXAM_ROWS = [0, 1]
const TOPIC_ROWS = [0, 1, 2, 3]
const LEGEND_ROWS = [0, 1, 2]

const RingChartSkeleton = () => (
  <div className="border-border bg-card flex flex-col items-center gap-6 rounded-md border px-[26px] py-6 sm:flex-row sm:gap-[26px]">
    <Skeleton className="size-32 shrink-0 rounded-full" />
    <div className="min-w-0 flex-1">
      <div className="flex h-[22.5px] items-center">
        <Skeleton className="h-[15px] w-[42%] rounded-[4px]" tone="secondary" />
      </div>
      <div className="mt-3.5">
        {LEGEND_ROWS.map((row) => (
          <div className="flex h-7 items-center gap-[9px]" key={row}>
            <Skeleton
              className="size-2 shrink-0 rounded-full"
              tone="secondary"
            />
            <Skeleton className="h-2.5 max-w-[132px] flex-1" tone="secondary" />
            <Skeleton className="h-2.5 w-4 shrink-0" tone="secondary" />
          </div>
        ))}
      </div>
    </div>
  </div>
)

export default function CertificationLoading() {
  return (
    <PageTemplate>
      <SkeletonRegion>
        <div className="flex h-[30.24px] items-center lg:h-[47.52px]">
          <Skeleton className="h-[21px] w-[68%] rounded-[5px] lg:h-[33px]" />
        </div>
        <div className="mt-3.5">
          <div className="flex h-[28.5px] items-center">
            <Skeleton
              className="h-[18px] w-[46%] rounded-[4px]"
              tone="secondary"
            />
          </div>
          <div className="flex h-[28.5px] items-center lg:hidden">
            <Skeleton
              className="h-[18px] w-[30%] rounded-[4px]"
              tone="secondary"
            />
          </div>
        </div>
        <div className="mt-2 flex h-[16.5px] items-center">
          <Skeleton className="h-[11px] w-[32%]" tone="secondary" />
        </div>
      </SkeletonRegion>

      <SkeletonRegion
        className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]"
        delayMs={120}
      >
        <RecommendedDrillSkeleton />
        <Skeleton className="min-h-[208px] rounded-md" tone="secondary" />
      </SkeletonRegion>

      <SkeletonRegion className="mt-14" delayMs={240}>
        <div className="flex h-7 items-center">
          <Skeleton className="h-[19px] w-[136px] rounded-[4px]" />
        </div>
        <div className="border-border bg-card mt-3.5 overflow-hidden rounded-md border">
          {EXAM_ROWS.map((row) => (
            <div
              className="border-row-border flex min-h-[60px] flex-wrap items-center gap-x-[18px] gap-y-2 px-[22px] py-2 not-first:border-t"
              key={row}
            >
              <Skeleton className="h-[11px] w-12 shrink-0" tone="secondary" />
              <Skeleton
                className="h-[15px] max-w-[320px] min-w-0 flex-1"
                tone="secondary"
              />
              <Skeleton className="h-2.5 w-5 shrink-0" tone="secondary" />
              <Skeleton
                className="h-9 w-[68px] shrink-0 rounded-[4px]"
                tone="secondary"
              />
            </div>
          ))}
        </div>
      </SkeletonRegion>

      <SkeletonRegion className="mt-14 grid gap-5 md:grid-cols-2" delayMs={360}>
        <RingChartSkeleton />
        <RingChartSkeleton />
      </SkeletonRegion>

      <SkeletonRegion className="mt-14" delayMs={480}>
        <div className="flex h-7 items-center">
          <Skeleton className="h-[19px] w-[74px] rounded-[4px]" />
        </div>
        <div className="border-border bg-card mt-3.5 overflow-hidden rounded-md border">
          <div className="border-border bg-table-header hidden h-10 items-center gap-5 border-b px-[22px] sm:flex">
            <span className="w-2" />
            <div className="flex-1">
              <Skeleton className="h-2 w-[38px]" tone="secondary" />
            </div>
            <div className="w-44">
              <Skeleton className="h-2 w-[52px]" tone="secondary" />
            </div>
            <div className="w-[62px]">
              <Skeleton className="ml-auto h-2 w-[34px]" tone="secondary" />
            </div>
          </div>
          {TOPIC_ROWS.map((row) => (
            <div
              className="border-row-border flex min-h-14 flex-wrap items-center gap-x-5 gap-y-2.5 px-[22px] py-3 not-first:border-t sm:flex-nowrap sm:py-0"
              key={row}
            >
              <Skeleton className="size-2 shrink-0 rounded-full" />
              <div className="flex h-[22.5px] min-w-0 flex-1 items-center">
                <Skeleton
                  className="h-[15px] w-full max-w-[340px]"
                  tone="secondary"
                />
              </div>
              <Skeleton
                className="order-last h-1.5 w-full rounded-full sm:order-none sm:w-44"
                tone="secondary"
              />
              <Skeleton className="h-2.5 w-[62px] shrink-0" tone="secondary" />
            </div>
          ))}
        </div>
      </SkeletonRegion>
    </PageTemplate>
  )
}
