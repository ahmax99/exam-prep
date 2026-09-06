import { Skeleton, SkeletonRegion } from '@/components/atoms'
import { PageTemplate } from '@/components/layout'

const BOOKMARK_ROWS = [0, 1, 2, 3, 4, 5]

export default function BookmarksLoading() {
  return (
    <PageTemplate>
      <SkeletonRegion>
        <div className="flex h-[45px] items-center">
          <Skeleton className="h-[22px] w-[286px] rounded-[5px]" />
        </div>
        <div className="mt-2.5 flex h-5 items-center">
          <Skeleton className="h-[14px] w-[248px]" tone="secondary" />
        </div>
      </SkeletonRegion>

      <SkeletonRegion className="mt-[22px]" delayMs={120}>
        <Skeleton className="h-11 w-full rounded-[4px] lg:w-[120px]" />
      </SkeletonRegion>

      <SkeletonRegion
        className="border-border bg-card mt-[30px] overflow-hidden rounded-lg border"
        delayMs={240}
      >
        {BOOKMARK_ROWS.map((row) => (
          <div
            className="border-row-border flex items-start gap-5 px-6 py-5 not-first:border-t"
            key={row}
          >
            <div className="min-w-0 flex-1">
              <div className="flex h-[22px] flex-wrap items-center gap-2.5">
                <Skeleton className="h-[11px] w-[72px]" tone="secondary" />
                <Skeleton className="h-[14px] w-[104px]" tone="secondary" />
                <Skeleton
                  className="h-[22px] w-[66px] rounded-[3px]"
                  tone="secondary"
                />
              </div>
              <div className="mt-2.5 flex h-[24.8px] items-center">
                <Skeleton className="h-4 w-full max-w-[520px]" />
              </div>
            </div>
            <div className="flex size-11 shrink-0 items-center justify-center">
              <Skeleton
                className="h-[17px] w-3.5 rounded-[2px]"
                tone="secondary"
              />
            </div>
          </div>
        ))}
      </SkeletonRegion>
    </PageTemplate>
  )
}
