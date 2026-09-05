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

export default async function DrillLauncherPage({
  params,
  searchParams
}: Readonly<DrillLauncherPageProps>) {
  const parsedCert = certSlugSchema.safeParse((await params).cert)
  if (!parsedCert.success) notFound()
  const cert = parsedCert.data

  const parsedScope = drillLauncherParamsSchema.safeParse(await searchParams)
  if (!parsedScope.success) notFound()

  const certResult = await catchAsyncError(getCertification(cert))
  if (certResult.isErr()) {
    if (certResult.error.code === 'NOT_FOUND') notFound()
    log.error(
      { error: certResult.error, certSlug: cert },
      'Failed to load certification for drill launcher'
    )
    return failureFallback
  }

  const { fresh, ...scope } = parsedScope.data
  const enterRun = fresh ? startRun : startOrResumeRun
  const runResult = await enterRun({ ...scope, certSlug: cert })
  if (runResult.isErr()) {
    if (runResult.error.code === 'BAD_REQUEST') notFound()
    if (runResult.error.code === 'NOT_FOUND') return emptyScope(cert)

    log.error(
      { error: runResult.error, certSlug: cert },
      'Failed to start drill run'
    )
    return failureFallback
  }

  redirect(`/${cert}/drill/${runResult.value.id}`)
}
