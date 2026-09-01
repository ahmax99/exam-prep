import Link from 'next/link'

import { MAX_RUN_LIMIT } from '@/features/drill/constants'
import type { DrillRecommendation } from '@/features/drill/lib/recommendation'
import { resolveRunSize } from '@/features/drill/lib/runSize'

interface RecommendedDrillProps {
  certSlug: string
  recommendation: DrillRecommendation
}

// `/[cert]`'s single primary action: one recommended run (missed → unseen →
// exam fallback, decided by `recommendDrill`) plus an optional link to the
// full remaining scope, both plain navigations to the launcher.
const RecommendedDrill = ({
  certSlug,
  recommendation
}: Readonly<RecommendedDrillProps>) => {
  const defaultSize = resolveRunSize(recommendation.available)
  const fullSize = resolveRunSize(recommendation.available, MAX_RUN_LIMIT)

  if (defaultSize === 0) return null

  const href = (limit: number) =>
    `/${certSlug}/drill?scopeKind=${recommendation.scopeKind}` +
    `&scopeValue=${encodeURIComponent(recommendation.scopeValue)}&limit=${limit}`

  return (
    <section
      aria-label="Recommended drill"
      className="border-border bg-card flex flex-col gap-2 rounded-lg border p-4"
      data-slot="recommended-drill"
    >
      <p className="font-medium">{recommendation.headline}</p>
      <p className="text-muted-foreground font-mono text-sm">
        {recommendation.available} in scope
      </p>
      <Link
        className="bg-foreground text-background flex min-h-11 w-full items-center justify-center rounded-lg px-4 font-medium lg:w-fit"
        data-slot="recommended-drill-primary"
        href={href(defaultSize)}
      >
        Drill {defaultSize} →
      </Link>
      {fullSize > defaultSize && (
        <Link
          className="text-muted-foreground flex min-h-11 w-fit items-center underline underline-offset-2"
          data-slot="recommended-drill-full"
          href={href(fullSize)}
        >
          or all {fullSize}
        </Link>
      )}
    </section>
  )
}

export { RecommendedDrill }
