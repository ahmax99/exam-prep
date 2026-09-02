import Link from 'next/link'

import { MasteryBar } from '@/components/atoms'
import type { CertificationSummary } from '@/features/catalog/server/api'
import type { CertificationMastery } from '@/features/progress/server/api'

interface CertificationCardProps {
  certification: CertificationSummary
  mastery: CertificationMastery | null
}

// The name/vendor row every branch below shares.
const CardHeading = ({
  certification,
  muted
}: Readonly<{
  certification: CertificationSummary
  muted: boolean
}>) => (
  <div className="flex items-baseline justify-between gap-2">
    <span className={muted ? 'text-foreground font-medium' : 'font-medium'}>
      {certification.name}
    </span>
    <span className={muted ? 'text-sm' : 'text-muted-foreground text-sm'}>
      {certification.vendor}
    </span>
  </div>
)

function CertificationCard({
  certification,
  mastery
}: Readonly<CertificationCardProps>) {
  if (!mastery || mastery.total === 0) {
    return (
      <div
        className="border-border bg-card text-muted-foreground flex flex-col gap-3 rounded-lg border p-4"
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
        className="border-border bg-card hover:border-foreground/30 flex min-h-11 flex-col gap-3 rounded-lg border p-4 transition-colors"
        data-slot="certification-card"
        href={`/${certification.slug}`}
      >
        <CardHeading certification={certification} muted={false} />
        <p className="text-muted-foreground text-sm">
          {total} questions · none attempted yet
        </p>
      </Link>
    )
  }

  return (
    <Link
      className="border-border bg-card hover:border-foreground/30 flex min-h-11 flex-col gap-3 rounded-lg border p-4 transition-colors"
      data-slot="certification-card"
      href={`/${certification.slug}`}
    >
      <CardHeading certification={certification} muted={false} />
      <p className="font-mono text-3xl">{masteryPercent}%</p>
      <MasteryBar mastered={mastered} shaky={shaky} total={total} />
      <dl className="text-muted-foreground grid grid-cols-3 gap-2 text-xs">
        <div>
          <dt>Mastered</dt>
          <dd className="text-foreground font-mono">{mastered}</dd>
        </div>
        <div>
          <dt>Missed</dt>
          <dd className="text-foreground font-mono">{missed}</dd>
        </div>
        <div>
          <dt>Unseen</dt>
          <dd className="text-foreground font-mono">{unseen}</dd>
        </div>
      </dl>
    </Link>
  )
}

export { CertificationCard }
