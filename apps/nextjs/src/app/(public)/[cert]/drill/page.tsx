import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/atoms'
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
    <div
      className="border-border border-l-destructive bg-card rounded-md border border-l-2 px-5 py-4 text-sm"
      data-slot="drill-launcher-error"
      role="alert"
    >
      Something went wrong starting this drill. Try again.
    </div>
  </PageTemplate>
)

const emptyScope = (certSlug: string) => (
  <PageTemplate>
    <div data-slot="drill-launcher-empty">
      <h1 className="text-2xl font-semibold tracking-tight">
        Nothing to drill
      </h1>
      <p className="text-prose-foreground mt-3 max-w-[56ch] text-[15px] leading-[1.6]">
        No questions match this scope right now. Pick another topic or exam to
        get a queue going.
      </p>
      <Button
        className="mt-6"
        nativeButton={false}
        render={<Link href={`/${certSlug}`} />}
        variant="outline"
      >
        <ArrowLeft />
        Back to the certification
      </Button>
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
