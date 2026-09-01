import { notFound } from 'next/navigation'

import { PageTemplate } from '@/components/layout'
import { logger } from '@/config/logger'
import { certSlugSchema } from '@/features/catalog/schemas/certPageParams.schema'
import { getCertification } from '@/features/catalog/server/api'
import { RUN_HISTORY_LIMIT } from '@/features/drill/constants'
import { getCertificationRunHistory } from '@/features/drill/server/api'
import { RunList } from '@/features/drill/server/components/RunList'
import { catchAsyncError } from '@/features/error/utils/catchError'
import { generatePageMetadata } from '@/features/metadata/utils/generatePageMetadata'

export const dynamic = 'force-dynamic'

const log = logger.child({ module: 'runs-page' })

export const generateMetadata = () =>
  generatePageMetadata({
    title: 'Runs',
    description: 'Every drill run recorded for this certification.'
  })

interface RunsPageProps {
  params: Promise<{ cert: string }>
}

const failureFallback = (
  <PageTemplate maxWidth="wide">
    <p className="text-muted-foreground">
      Something went wrong loading this page. Try refreshing.
    </p>
  </PageTemplate>
)

export default async function RunsPage({ params }: Readonly<RunsPageProps>) {
  const parsedCert = certSlugSchema.safeParse((await params).cert)
  if (!parsedCert.success) notFound()
  const cert = parsedCert.data

  const certResult = await catchAsyncError(getCertification(cert))
  if (certResult.isErr()) {
    if (certResult.error.code === 'NOT_FOUND') notFound()
    log.error(
      { error: certResult.error, certSlug: cert },
      'Failed to load certification for runs page'
    )
    return failureFallback
  }
  const certification = certResult.value

  const runsResult = await getCertificationRunHistory(cert)
  if (runsResult.isErr()) {
    log.error(
      { error: runsResult.error, certSlug: cert },
      'Failed to load run history'
    )
    return failureFallback
  }

  const runs = runsResult.value

  return (
    <PageTemplate
      back={{ href: `/${cert}`, label: `Back to ${certification.name}` }}
      maxWidth="wide"
    >
      <div className="pb-16 lg:pb-0">
        <h1 className="text-2xl font-semibold">Runs</h1>

        {runs.length === 0 ? (
          <p className="text-muted-foreground mt-8 max-w-prose">
            No runs recorded yet for {certification.name}. Start a drill from
            the certification page to see it appear here.
          </p>
        ) : (
          <>
            {runs.length === RUN_HISTORY_LIMIT && (
              <p className="text-muted-foreground mt-4 text-sm">
                Showing only the most recent {RUN_HISTORY_LIMIT} runs.
              </p>
            )}
            <div className="mt-6">
              <RunList certSlug={cert} runs={runs} />
            </div>
          </>
        )}
      </div>
    </PageTemplate>
  )
}
