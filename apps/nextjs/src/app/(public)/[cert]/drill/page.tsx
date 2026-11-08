import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/atoms'
import { PageTemplate } from '@/components/layout'
import { requireCertification } from '@/features/catalog/server/api'
import { drillLauncherParamsSchema } from '@/features/drill/schemas/drillLauncherParams.schema'
import { startOrResumeRun, startRun } from '@/features/drill/server/api'
import { catchAsyncError } from '@/features/error/utils/catchError'
import { generatePageMetadata } from '@/features/metadata/utils/generatePageMetadata'

export const dynamic = 'force-dynamic'

export const generateMetadata = () =>
  generatePageMetadata({
    title: 'Starting drill',
    description: 'Builds a question queue for the selected scope.'
  })

interface DrillLauncherPageProps {
  params: Promise<{ cert: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

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
  const { slug: cert } = await requireCertification((await params).cert)

  const parsedScope = drillLauncherParamsSchema.safeParse(await searchParams)
  if (!parsedScope.success) notFound()

  const { fresh, ...scope } = parsedScope.data
  const enterRun = fresh ? startRun : startOrResumeRun
  const runResult = await catchAsyncError(
    enterRun({ ...scope, certSlug: cert })
  )
  if (runResult.isErr()) {
    if (runResult.error.code === 'BAD_REQUEST') notFound()
    if (runResult.error.code === 'NOT_FOUND') return emptyScope(cert)
    throw runResult.error
  }

  redirect(`/${cert}/drill/${runResult.value.id}`)
}
