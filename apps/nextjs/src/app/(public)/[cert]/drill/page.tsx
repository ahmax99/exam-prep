import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { PageTemplate } from '@/components/layout'
import { logger } from '@/config/logger'
import { certSlugSchema } from '@/features/catalog/schemas/certPageParams.schema'
import { getCertification } from '@/features/catalog/server/api'
import { drillLauncherParamsSchema } from '@/features/drill/schemas/drillLauncherParams.schema'
import { startOrResumeRun, startRun } from '@/features/drill/server/api'
import { catchAsyncError } from '@/features/error/utils/catchError'
import { generatePageMetadata } from '@/features/metadata/utils/generatePageMetadata'

export const dynamic = 'force-dynamic'

const log = logger.child({ module: 'drill-launcher-page' })

export const generateMetadata = () =>
  generatePageMetadata({
    title: 'Starting drill',
    description: 'Builds a question queue for the selected scope.'
  })

interface DrillLauncherPageProps {
  params: Promise<{ cert: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const failureFallback = (
  <PageTemplate>
    <p className="text-muted-foreground">
      Something went wrong starting this drill. Try again.
    </p>
  </PageTemplate>
)

const emptyScope = (certSlug: string) => (
  <PageTemplate>
    <div data-slot="drill-launcher-empty">
      <h1 className="text-2xl font-semibold">Nothing to drill</h1>
      <p className="text-muted-foreground mt-2 max-w-prose">
        No questions match this scope right now. Pick another topic or exam to
        get a queue going.
      </p>
      <Link className="mt-6 inline-flex underline" href={`/${certSlug}`}>
        Back to the certification
      </Link>
    </div>
  </PageTemplate>
)

// Turns a scope in the URL into a run: every "Drill →" link on the
// certification, bookmarks and progress surfaces lands here, and leaves
// redirected to the created run.
export default async function DrillLauncherPage({
  params,
  searchParams
}: Readonly<DrillLauncherPageProps>) {
  const parsedCert = certSlugSchema.safeParse((await params).cert)
  if (!parsedCert.success) notFound()
  const cert = parsedCert.data

  const parsedScope = drillLauncherParamsSchema.safeParse(await searchParams)
  if (!parsedScope.success) notFound()

  // An unknown slug would otherwise reach `startRun` and come back as an empty
  // queue, which reads as "nothing to drill" rather than the 404 it is.
  const certResult = await catchAsyncError(getCertification(cert))
  if (certResult.isErr()) {
    if (certResult.error.code === 'NOT_FOUND') notFound()
    log.error(
      { error: certResult.error, certSlug: cert },
      'Failed to load certification for drill launcher'
    )
    return failureFallback
  }

  // Re-entering a scope resumes the run already holding answers; `?fresh=1`
  // opts out and queues the scope again from the start.
  const { fresh, ...scope } = parsedScope.data
  const enterRun = fresh ? startRun : startOrResumeRun
  const runResult = await enterRun({ ...scope, certSlug: cert })
  if (runResult.isErr()) {
    // A scope kind whose required `scopeValue` the URL omitted — a malformed
    // link, not a transient failure a retry could fix.
    if (runResult.error.code === 'BAD_REQUEST') notFound()
    if (runResult.error.code === 'NOT_FOUND') return emptyScope(cert)

    log.error(
      { error: runResult.error, certSlug: cert },
      'Failed to start drill run'
    )
    return failureFallback
  }

  // Outside the error handling above: `redirect` signals by throwing, so it
  // must not run inside anything that catches.
  redirect(`/${cert}/drill/${runResult.value.id}`)
}
