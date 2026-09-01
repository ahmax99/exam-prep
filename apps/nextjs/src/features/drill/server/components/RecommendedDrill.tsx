import Link from 'next/link'

import type { DrillRecommendation } from '@/features/drill/lib/recommendation'

interface RecommendedDrillProps {
  certSlug: string
  recommendation: DrillRecommendation
}

// `/[cert]`'s single primary action: one recommended run (missed → unseen →
// exam fallback, decided by `recommendDrill`) covering every question in
// that scope — a plain navigation to the launcher, no size to pick.
const RecommendedDrill = ({
  certSlug,
  recommendation
}: Readonly<RecommendedDrillProps>) => {
  if (recommendation.available === 0) return null

  const href =
    `/${certSlug}/drill?scopeKind=${recommendation.scopeKind}` +
    `&scopeValue=${encodeURIComponent(recommendation.scopeValue)}`

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
        href={href}
      >
        Drill {recommendation.available} →
      </Link>
    </section>
  )
}

export { RecommendedDrill }
