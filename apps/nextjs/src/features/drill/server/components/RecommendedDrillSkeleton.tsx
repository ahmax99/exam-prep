import { Skeleton } from '@/components/atoms'

const RecommendedDrillSkeleton = () => (
  <div
    className="bg-skeleton flex min-h-[208px] flex-col justify-between gap-8 rounded-md px-8 py-[30px]"
    data-slot="recommended-drill-skeleton"
  >
    <div className="min-w-0">
      <div className="flex h-[13.5px] items-center">
        <Skeleton className="h-2 w-[124px]" tone="secondary" />
      </div>
      <div className="mt-3">
        <div className="flex h-8 items-center">
          <Skeleton
            className="h-[22px] w-[86%] rounded-[4px]"
            tone="secondary"
          />
        </div>
        <div className="flex h-8 items-center sm:hidden">
          <Skeleton
            className="h-[22px] w-[52%] rounded-[4px]"
            tone="secondary"
          />
        </div>
      </div>
    </div>

    <div className="flex flex-wrap items-end justify-between gap-6">
      <Skeleton className="h-[54px] w-[200px] rounded-[5px]" tone="secondary" />
      <Skeleton
        className="h-11 w-[132px] shrink-0 rounded-[4px]"
        tone="secondary"
      />
    </div>
  </div>
)

export { RecommendedDrillSkeleton }
