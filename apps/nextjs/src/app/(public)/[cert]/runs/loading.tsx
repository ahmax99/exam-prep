import { Skeleton, SkeletonRegion } from '@/components/atoms'
import { PageTemplate } from '@/components/layout'

const RUN_ROWS = [0, 1, 2, 3, 4, 5]

export default function RunsLoading() {
  return (
    <PageTemplate>
      <SkeletonRegion className="mb-6 flex min-h-11 items-center gap-2">
        <Skeleton className="size-4 shrink-0 rounded-[2px]" tone="secondary" />
        <Skeleton className="h-[14px] w-[176px]" tone="secondary" />
      </SkeletonRegion>

      <div className="pb-16 lg:pb-0">
        <SkeletonRegion className="flex h-[45px] items-center" delayMs={120}>
          <Skeleton className="h-[22px] w-[92px] rounded-[5px]" />
        </SkeletonRegion>

        <SkeletonRegion
          className="border-border bg-card mt-[26px] overflow-hidden rounded-lg border"
          delayMs={240}
        >
          <div className="w-full overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="bg-table-header border-border flex h-[38px] items-center border-b px-6">
                <div className="w-[190px]">
                  <Skeleton className="h-2 w-[46px]" tone="secondary" />
                </div>
                <div className="flex-1">
                  <Skeleton className="h-2 w-[38px]" tone="secondary" />
                </div>
                <div className="w-[100px]">
                  <Skeleton className="h-2 w-[38px]" tone="secondary" />
                </div>
                <div className="flex w-16 justify-end">
                  <Skeleton className="h-2 w-2" tone="secondary" />
                </div>
              </div>

              {RUN_ROWS.map((row) => (
                <div
                  className="border-row-border flex min-h-[50px] items-center px-6 not-first:border-t"
                  key={row}
                >
                  <div className="w-[190px]">
                    <Skeleton className="h-[11px] w-[132px]" tone="secondary" />
                  </div>
                  <div className="flex-1">
                    <Skeleton
                      className="h-[15px] max-w-[240px]"
                      tone="secondary"
                    />
                  </div>
                  <div className="w-[100px]">
                    <Skeleton className="h-[11px] w-[52px]" tone="secondary" />
                  </div>
                  <div className="flex w-16 justify-end">
                    <Skeleton className="h-[11px] w-[34px]" tone="secondary" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SkeletonRegion>
      </div>
    </PageTemplate>
  )
}
