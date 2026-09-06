import { Skeleton, SkeletonRegion } from '@/components/atoms'
import { PageTemplate } from '@/components/layout'

const OUTCOME_CELLS = [0, 1, 2, 3]

export default function RunSummaryLoading() {
  return (
    <PageTemplate>
      <SkeletonRegion className="mb-6 flex min-h-11 items-center gap-2">
        <Skeleton className="size-4 shrink-0 rounded-[2px]" tone="secondary" />
        <Skeleton className="h-[14px] w-[176px]" tone="secondary" />
      </SkeletonRegion>

      <SkeletonRegion
        className="border-border bg-card rounded-lg border px-9 py-[34px]"
        delayMs={120}
      >
        <div className="flex flex-wrap items-start justify-between gap-x-12 gap-y-4 sm:flex-nowrap">
          <div className="w-full min-w-0 sm:flex-1">
            <div className="flex h-[13.5px] items-center">
              <Skeleton className="h-2 w-[76px]" tone="secondary" />
            </div>
            <div className="mt-3 max-w-[42ch]">
              <div className="flex h-[32.94px] items-center">
                <Skeleton className="h-[22px] w-full rounded-[4px]" />
              </div>
              <div className="flex h-[32.94px] items-center">
                <Skeleton className="h-[22px] w-full rounded-[4px] sm:w-[58%]" />
              </div>
              <div className="flex h-[32.94px] items-center sm:hidden">
                <Skeleton className="h-[22px] w-full rounded-[4px]" />
              </div>
              <div className="flex h-[32.94px] items-center sm:hidden">
                <Skeleton className="h-[22px] w-[54%] rounded-[4px]" />
              </div>
            </div>
          </div>
          <div className="flex h-[59px] shrink-0 items-end gap-2.5">
            <Skeleton className="h-[55px] w-[84px] rounded-[5px]" />
            <Skeleton
              className="h-[22px] w-3.5 rounded-[3px]"
              tone="secondary"
            />
          </div>
        </div>

        <div className="mt-[26px] flex h-[16.5px] items-center">
          <Skeleton className="h-[11px] w-[104px]" tone="secondary" />
        </div>

        <Skeleton className="mt-2.5 h-2.5 rounded-full" tone="secondary" />

        <div className="bg-row-border mt-[26px] grid grid-cols-2 gap-px sm:grid-cols-4">
          {OUTCOME_CELLS.map((cell) => (
            <div
              className="bg-card min-w-0 px-[18px] py-2 first:pl-0 sm:py-0"
              key={cell}
            >
              <div className="flex h-[19.5px] items-center gap-2">
                <Skeleton
                  className="size-2 shrink-0 rounded-full"
                  tone="secondary"
                />
                <Skeleton className="h-[13px] w-[76px]" tone="secondary" />
              </div>
              <div className="mt-2 flex h-[33px] items-center">
                <Skeleton className="h-[22px] w-[38px] rounded-[3px]" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-[30px] flex h-11 gap-3.5">
          <Skeleton className="h-11 w-[152px] rounded-[4px]" />
          <Skeleton className="h-11 w-[136px] rounded-[4px]" tone="secondary" />
        </div>
      </SkeletonRegion>

      <SkeletonRegion
        className="mt-5 flex min-h-11 items-center gap-2.5"
        delayMs={240}
      >
        <Skeleton
          className="size-3.5 shrink-0 rounded-[2px]"
          tone="secondary"
        />
        <Skeleton className="h-2 w-[68px]" tone="secondary" />
      </SkeletonRegion>
    </PageTemplate>
  )
}
