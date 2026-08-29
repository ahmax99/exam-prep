import Link from 'next/link'

import { MasteryBar } from '@/components/atoms'
import type { CertificationSummary } from '@/features/catalog/server/api'
import type { CertificationMastery } from '@/features/progress/server/api'

interface CertificationCardProps {
  certification: CertificationSummary
  mastery: CertificationMastery | null
}

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
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-foreground font-medium">
            {certification.name}
          </span>
          <span className="text-sm">{certification.vendor}</span>
        </div>
        <p className="font-mono text-3xl">—</p>
        <p className="text-sm">No questions imported yet</p>
      </div>
    )
  }

  const { mastered, missed, unseen, masteryPercent, shaky, total } = mastery

  return (
    <Link
      className="border-border bg-card hover:border-foreground/30 flex min-h-11 flex-col gap-3 rounded-lg border p-4 transition-colors"
      data-slot="certification-card"
      href={`/${certification.slug}`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium">{certification.name}</span>
        <span className="text-muted-foreground text-sm">
          {certification.vendor}
        </span>
      </div>
      <p className="font-mono text-3xl">{masteryPercent}%</p>
      <MasteryBar mastered={mastered} shaky={shaky} total={total} />
      <dl className="text-muted-foreground grid grid-cols-3 gap-2 font-mono text-xs">
        <div>
          <dt className="uppercase">Mastered</dt>
          <dd className="text-foreground">{mastered}</dd>
        </div>
        <div>
          <dt className="uppercase">Missed</dt>
          <dd className="text-foreground">{missed}</dd>
        </div>
        <div>
          <dt className="uppercase">Unseen</dt>
          <dd className="text-foreground">{unseen}</dd>
        </div>
      </dl>
    </Link>
  )
}

export { CertificationCard }
