import { notFound } from 'next/navigation'

import { ChevronDown } from 'lucide-react'

import { PageTemplate } from '@/components/layout'
import { requireCertification } from '@/features/catalog/server/api'
import { SummaryActions } from '@/features/drill/client/components/SummaryActions'
import {
  buildHeadline,
  describeScope,
  toHistoryRows,
  weakSpotsExamCode
} from '@/features/drill/lib/summary'
import { idSchema } from '@/features/drill/schemas/run.schema'
import { getRunHistory, getRunSummary } from '@/features/drill/server/api'
import { MissReview } from '@/features/drill/server/components/MissReview'
import { RunHistoryTable } from '@/features/drill/server/components/RunHistoryTable'
import { RunSummary } from '@/features/drill/server/components/RunSummary'
import { SkippedReview } from '@/features/drill/server/components/SkippedReview'
import { orNotFound } from '@/features/error/utils/orNotFound'
import { generatePageMetadata } from '@/features/metadata/utils/generatePageMetadata'

export const dynamic = 'force-dynamic'

export const generateMetadata = () =>
  generatePageMetadata({
    title: 'Run summary',
    description:
      'Score, outcome breakdown, and history for a finished drill run.'
  })

interface RunSummaryPageProps {
  params: Promise<{ cert: string; runId: string }>
}

export default async function RunSummaryPage({
  params
}: Readonly<RunSummaryPageProps>) {
  const route = await params
  const certification = await requireCertification(route.cert)
  const cert = certification.slug

  const parsedRunId = idSchema.safeParse(route.runId)
  if (!parsedRunId.success) notFound()
  const runId = parsedRunId.data

  const summary = await orNotFound(getRunSummary({ runId, certSlug: cert }))
  const history = await getRunHistory({
    certSlug: cert,
    scope: {
      scopeKind: summary.run.scopeKind,
      scopeValue: summary.run.scopeValue
    }
  })

  const headline = buildHeadline(
    summary.outcomes,
    describeScope(summary.run.scopeKind, summary.run.scopeValue, cert)
  )

  return (
    <PageTemplate
      back={{ href: `/${cert}`, label: `Back to ${certification.name}` }}
    >
      <RunSummary headline={headline} outcomes={summary.outcomes}>
        <SummaryActions
          certSlug={cert}
          runId={runId}
          weakSpotsExamCode={weakSpotsExamCode(summary.misses)}
        />
      </RunSummary>
      <SkippedReview
        certSlug={cert}
        runId={runId}
        skipped={summary.skipped}
        total={summary.outcomes.total}
      />
      <MissReview misses={summary.misses} />

      <details className="group/past-runs mt-5" data-slot="past-runs">
        <summary className="text-muted-foreground inline-flex min-h-11 cursor-pointer list-none items-center gap-2.5 font-mono text-[10px] font-medium tracking-widest uppercase">
          <ChevronDown
            aria-hidden="true"
            className="max-group-open/past-runs:-rotate-90 size-3.5 transition-transform group-open/past-runs:rotate-0"
          />
          Past runs
        </summary>
        <div className="mt-2.5">
          <RunHistoryTable rows={toHistoryRows(history, summary.run.id)} />
        </div>
      </details>
    </PageTemplate>
  )
}
