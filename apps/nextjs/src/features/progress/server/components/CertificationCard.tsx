import Link from 'next/link'

import { MasteryBar } from '@/components/atoms'
import type { CertificationSummary } from '@/features/catalog/server/api'
import type { CertificationMastery } from '@/features/progress/server/api'
import { cn } from '@/utils/mergeClass'

interface CertificationCardProps {
  certification: CertificationSummary
  mastery: CertificationMastery | null
}

const cardClassName =
  'border-border bg-card hover:border-foreground/30 focus-visible:ring-ring/50 flex min-h-11 flex-col gap-4 rounded-xl border p-5 transition-colors focus-visible:ring-[3px] focus-visible:outline-none'

const CardHeading = ({
  certification,
  muted
}: Readonly<{
  certification: CertificationSummary
  muted: boolean
}>) => (
  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
    <span className={muted ? 'text-foreground font-medium' : 'font-medium'}>
      {certification.name}
    </span>
    <span className="text-muted-foreground text-sm sm:shrink-0">
      {certification.vendor}
    </span>
  </div>
)

const Stat = ({
  label,
  value,
  swatch
}: Readonly<{ label: string; value: number; swatch?: string }>) => (
  <div className="flex flex-col gap-0.5">
    <dt className="text-muted-foreground flex items-center gap-1.5 text-xs">
      {swatch && (
        <span
          aria-hidden="true"
          className={cn('size-1.5 shrink-0 rounded-full', swatch)}
        />
      )}
      {label}
    </dt>
    <dd className="font-mono text-sm" data-numeric>
      {value}
    </dd>
  </div>
)

function CertificationCard({
  certification,
  mastery
}: Readonly<CertificationCardProps>) {
  if (!mastery || mastery.total === 0) {
    return (
      <div
        className="border-border bg-card text-muted-foreground flex flex-col gap-3 rounded-xl border p-5"
        data-slot="certification-card"
      >
        <CardHeading certification={certification} muted />
        <p className="text-sm">No questions imported yet</p>
      </div>
    )
  }

  const { mastered, missed, unseen, masteryPercent, shaky, total, attempted } =
    mastery

  if (attempted === 0) {
    return (
      <Link
        className={cardClassName}
        data-slot="certification-card"
        href={`/${certification.slug}`}
      >
        <CardHeading certification={certification} muted={false} />
        <p className="text-muted-foreground text-sm">
          <span className="font-mono" data-numeric>
            {total}
          </span>{' '}
          questions · none attempted yet
        </p>
      </Link>
    )
  }

  return (
    <Link
      className={cardClassName}
      data-slot="certification-card"
      href={`/${certification.slug}`}
    >
      <CardHeading certification={certification} muted={false} />

      {}
      <div className="flex items-center gap-4">
        <span
          className="font-mono text-2xl leading-none font-medium"
          data-numeric
        >
          {masteryPercent}%
        </span>
        <MasteryBar
          className="flex-1"
          mastered={mastered}
          shaky={shaky}
          total={total}
        />
      </div>

      {}
      <dl className="border-border grid grid-cols-2 gap-4 border-t pt-3 sm:grid-cols-4">
        <Stat label="Mastered" swatch="bg-success" value={mastered} />
        <Stat label="Shaky" swatch="bg-warning" value={shaky} />
        <Stat label="Missed" value={missed} />
        <Stat label="Unseen" value={unseen} />
      </dl>
    </Link>
  )
}

export { CertificationCard }
