import { notFound } from 'next/navigation'

import { PageTemplate } from '@/components/layout'
import { logger } from '@/config/logger'
import { certSlugSchema } from '@/features/catalog/schemas/certPageParams.schema'
import { SummaryActions } from '@/features/drill/client/components/SummaryActions'
import { toHistoryRows } from '@/features/drill/lib/summary'
import { idSchema } from '@/features/drill/schemas/run.schema'
import { getRunHistory, getRunSummary } from '@/features/drill/server/api'
import { MissReview } from '@/features/drill/server/components/MissReview'
import { RunHistoryTable } from '@/features/drill/server/components/RunHistoryTable'
import { RunSummary } from '@/features/drill/server/components/RunSummary'
import { generatePageMetadata } from '@/features/metadata/utils/generatePageMetadata'

export const dynamic = 'force-dynamic'

const log = logger.child({ module: 'run-summary-page' })

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
  const { cert, runId } = await params

  const parsedCert = certSlugSchema.safeParse(cert)
  const parsedRunId = idSchema.safeParse(runId)
  if (!parsedCert.success || !parsedRunId.success) notFound()

  const summaryResult = await getRunSummary({
    runId: parsedRunId.data,
    certSlug: parsedCert.data
  })

  if (summaryResult.isErr()) {
    // A well-formed but nonexistent or wrong-cert runId is a real 404.
    if (summaryResult.error.code === 'NOT_FOUND') notFound()

    log.error(
      { error: summaryResult.error, runId },
      'Failed to load run summary'
    )
    return (
      <PageTemplate maxWidth="wide">
        <p className="text-muted-foreground">
          Something went wrong loading this summary. Try refreshing.
        </p>
      </PageTemplate>
    )
  }

  const summary = summaryResult.value

  // Runs after the summary read (it needs the run's own scope) — sequential,
  // not Promise.all. A failure here must not block the score block or actions.
  const historyResult = await getRunHistory({
    scopeKind: summary.run.scopeKind,
    scopeValue: summary.run.scopeValue,
    certSlug: parsedCert.data
  })

  const historyContent = historyResult.match(
    (historyRuns) => (
      <RunHistoryTable rows={toHistoryRows(historyRuns, summary.run.id)} />
    ),
    (error) => {
      log.error({ error, runId }, 'Failed to load run history')
      return (
        <p className="text-muted-foreground">
          History is unavailable right now.
        </p>
      )
    }
  )

  return (
    <PageTemplate
      back={{ href: `/${cert}`, label: `Back to ${cert}` }}
      maxWidth="wide"
    >
      <div className="pb-24 md:pb-0">
        <RunSummary outcomes={summary.outcomes} />
        <SummaryActions
          certSlug={cert}
          missCount={summary.misses.length}
          runId={runId}
        />
        {historyContent}
        <MissReview misses={summary.misses} />
      </div>
    </PageTemplate>
  )
}
