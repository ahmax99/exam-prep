import Link from 'next/link'

import { ArrowRight } from 'lucide-react'

import type { DrillRecommendation } from '@/features/drill/lib/recommendation'

interface RecommendedDrillProps {
  certSlug: string
  recommendation: DrillRecommendation
}

// The one peak on its page: the whole panel is the link, and it is the single
// place the accent is spent. Everything around it stays monochrome so this
// reads as the obvious next move rather than one more card in the stack.
const RecommendedDrill = ({
  certSlug,
  recommendation
}: Readonly<RecommendedDrillProps>) => {
  if (recommendation.available === 0) return null

  const href =
    `/${certSlug}/drill?scopeKind=${recommendation.scopeKind}` +
    `&scopeValue=${encodeURIComponent(recommendation.scopeValue)}`

  return (
    <Link
      aria-label={`${recommendation.headline} — start a drill of ${recommendation.available} questions`}
      className="bg-brand text-brand-foreground focus-visible:ring-ring/50 group/drill flex flex-col gap-6 rounded-xl p-6 transition-opacity hover:opacity-95 focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:outline-none md:flex-row md:items-end md:justify-between md:gap-10 md:p-8"
      data-slot="recommended-drill"
      href={href}
    >
      <div className="min-w-0">
        <p className="text-xl leading-snug font-medium">
          {recommendation.headline}
        </p>

        {/* The count is the payload of the action, not a stat tile: it is set
            at display scale because it is what you are about to commit to. */}
        <p className="mt-3 flex items-baseline gap-3">
          <span
            className="font-mono text-6xl leading-none font-medium tracking-tighter md:text-7xl"
            data-numeric
          >
            {recommendation.available}
          </span>
          {/* Tinted from the panel's own foreground — never muted gray, which
              has no contrast guarantee on a colored ground. */}
          <span className="text-brand-foreground/75 text-sm">
            {recommendation.available === 1 ? 'question' : 'questions'} queued
          </span>
        </p>
      </div>

      {/* Sits at the far edge from md up so the band reads as a composition
          rather than a wide field with the content bunched in one corner. */}
      <span className="text-brand-foreground border-brand-foreground/40 group-hover/drill:border-brand-foreground inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-lg border px-5 font-medium transition-colors md:self-auto">
        Start drill
        <ArrowRight aria-hidden="true" className="size-4" />
      </span>
    </Link>
  )
}

export { RecommendedDrill }
