import { Skeleton, SkeletonRegion } from '@/components/atoms'

const OPTION_ROWS = [0, 1, 2, 3]
const SHORTCUT_ROWS = [0, 1, 2, 3]

export default function DrillLoading() {
  return (
    <main className="px-4 py-6 lg:px-10 lg:py-14">
      <div className="mx-auto w-full max-w-[1072px]">
        <div className="border-border bg-card rounded-lg border p-4 pb-24 md:p-10 md:pb-10 xl:grid xl:grid-cols-[minmax(0,1fr)_240px] xl:items-start xl:gap-12">
          <SkeletonRegion className="min-w-0">
            <div className="mb-7 flex h-11 items-center justify-between gap-3.5 xl:justify-end">
              <div className="flex flex-1 items-center gap-3 xl:hidden">
                <Skeleton className="h-[13px] w-11" tone="secondary" />
                <Skeleton
                  className="h-1.5 max-w-24 flex-1 rounded-full"
                  tone="secondary"
                />
              </div>
              <Skeleton
                className="size-11 shrink-0 rounded-[4px]"
                tone="secondary"
              />
              <Skeleton
                className="h-11 w-[42px] shrink-0 rounded-[4px]"
                tone="secondary"
              />
            </div>

            <div className="flex min-h-11 items-start gap-3.5">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
                <Skeleton className="h-[22px] w-[50px] rounded-[3px]" />
                <div className="flex h-5 items-center">
                  <Skeleton className="h-[14px] w-[164px]" tone="secondary" />
                </div>
                <Skeleton
                  className="size-[3px] rounded-full"
                  tone="secondary"
                />
                <div className="flex h-5 items-center">
                  <Skeleton className="h-[14px] w-[92px]" tone="secondary" />
                </div>
              </div>
              <div className="flex size-11 shrink-0 items-center justify-center">
                <Skeleton className="h-4 w-3 rounded-[2px]" tone="secondary" />
              </div>
            </div>

            <div className="mt-[26px] mb-8">
              <div className="flex h-[27px] items-center md:h-[36px]">
                <Skeleton className="h-5 w-[86%] rounded-[4px] md:h-[26px]" />
              </div>
              <div className="flex h-[27px] items-center md:h-[36px]">
                <Skeleton className="h-5 w-full rounded-[4px] md:h-[26px] md:w-[54%]" />
              </div>
              <div className="flex h-[27px] items-center md:hidden">
                <Skeleton className="h-5 w-[48%] rounded-[4px]" />
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {OPTION_ROWS.map((row) => (
                <Skeleton
                  className="h-[58px] rounded-md"
                  key={row}
                  tone="secondary"
                />
              ))}
            </div>

            <div className="bg-card border-border fixed inset-x-0 bottom-0 z-30 flex h-[76px] items-center gap-3.5 border-t p-4 md:static md:mt-8 md:h-11 md:border-0 md:bg-transparent md:p-0">
              <Skeleton
                className="h-11 w-[111px] rounded-[4px]"
                tone="secondary"
              />
              <Skeleton
                className="h-11 w-[82px] rounded-[4px]"
                tone="secondary"
              />
              <Skeleton className="ml-auto h-11 w-[115px] rounded-[4px]" />
            </div>
          </SkeletonRegion>

          <SkeletonRegion
            className="border-border hidden border-l pl-8 xl:block"
            delayMs={120}
          >
            <div className="flex h-[13.5px] items-center">
              <Skeleton className="h-2 w-[62px]" tone="secondary" />
            </div>
            <div className="mt-3 flex h-[35.5px] items-center">
              <Skeleton className="h-[26px] w-[86px] rounded-[4px]" />
            </div>
            <Skeleton className="mt-3.5 h-1.5 rounded-full" tone="secondary" />
            <div className="mt-2.5 flex h-[15px] items-center">
              <Skeleton className="h-2.5 w-[84px]" tone="secondary" />
            </div>

            <div className="mt-9">
              <div className="flex h-[13.5px] items-center">
                <Skeleton className="h-2 w-[68px]" tone="secondary" />
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {SHORTCUT_ROWS.map((row) => (
                  <div className="flex h-[19.5px] items-center gap-3" key={row}>
                    <Skeleton
                      className="h-2.5 w-[30px] shrink-0"
                      tone="secondary"
                    />
                    <Skeleton className="h-[13px] w-[68px]" tone="secondary" />
                  </div>
                ))}
              </div>
            </div>
          </SkeletonRegion>
        </div>
      </div>
    </main>
  )
}
