import Link from 'next/link'

import { ArrowRight } from 'lucide-react'

import { MicroLabel } from '@/components/atoms'
import { drillHref } from '@/features/drill/lib/drillHref'
import type { DrillRecommendation } from '@/features/drill/lib/recommendation'
import { cn } from '@/utils/mergeClass'

interface RecommendedDrillProps {
  certSlug: string
  recommendation: DrillRecommendation
  className?: string
}

const RecommendedDrill = ({
  certSlug,
  recommendation,
  className
}: Readonly<RecommendedDrillProps>) => {
  if (recommendation.available === 0) return null

  const href = drillHref(certSlug, {
    scopeKind: recommendation.scopeKind,
    scopeValue: recommendation.scopeValue
  })

  return (
    <Link
      aria-label={`${recommendation.headline} — start a drill of ${recommendation.available} questions`}
      className={cn(
        'bg-brand text-brand-foreground focus-visible:ring-ring/50 group/drill flex min-h-[208px] flex-col justify-between gap-8 rounded-md px-8 py-[30px] transition-opacity hover:opacity-95 focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:outline-none',
        className
      )}
      data-slot="recommended-drill"
      href={href}
    >
      <div className="min-w-0">
        <MicroLabel className="text-brand-foreground">
          Recommended next
        </MicroLabel>
        <p className="mt-3 text-2xl font-semibold tracking-tight">
          {recommendation.headline}
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-6">
        <p className="flex items-baseline gap-3">
          <span
            className="font-mono text-[60px] leading-[0.9] tracking-[-0.08em]"
            data-numeric
          >
            {recommendation.available}
          </span>
          <span className="text-sm">
            {recommendation.available === 1 ? 'question' : 'questions'} queued
          </span>
        </p>

        {/* The hero inverts: the card's ink becomes this control's fill. */}
        <span className="bg-brand-foreground text-accent-foreground inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[4px] px-5 text-[15px] font-semibold">
          Start drill
          <ArrowRight aria-hidden="true" className="size-4" />
        </span>
      </div>
    </Link>
  )
}

export { RecommendedDrill }
