import { Empty } from '@/components/atoms'
import { PageTemplate } from '@/components/layout'
import { requireCertification } from '@/features/catalog/server/api'
import { RUN_HISTORY_LIMIT } from '@/features/drill/constants'
import { getRunHistory } from '@/features/drill/server/api'
import { RunList } from '@/features/drill/server/components/RunList'
import { generatePageMetadata } from '@/features/metadata/utils/generatePageMetadata'

export const dynamic = 'force-dynamic'

export const generateMetadata = () =>
  generatePageMetadata({
    title: 'Runs',
    description: 'Every drill run recorded for this certification.'
  })

interface RunsPageProps {
  params: Promise<{ cert: string }>
}

export default async function RunsPage({ params }: Readonly<RunsPageProps>) {
  const certification = await requireCertification((await params).cert)
  const cert = certification.slug
  const runs = await getRunHistory({ certSlug: cert })

  return (
    <PageTemplate
      back={{ href: `/${cert}`, label: `Back to ${certification.name}` }}
    >
      <div className="pb-16 lg:pb-0">
        <h1 className="text-[30px] font-semibold tracking-[-0.025em]">Runs</h1>

        {runs.length === 0 ? (
          <Empty
            className="mt-7"
            description={`No runs recorded yet for ${certification.name}. Start a drill from the certification page and every run you finish lands here, newest first.`}
            label="Runs"
            title="No runs yet"
          />
        ) : (
          <>
            {runs.length === RUN_HISTORY_LIMIT && (
              <p className="text-muted-foreground mt-4 text-sm">
                Showing only the most recent {RUN_HISTORY_LIMIT} runs.
              </p>
            )}
            <div className="mt-[26px]">
              <RunList certSlug={cert} runs={runs} />
            </div>
          </>
        )}
      </div>
    </PageTemplate>
  )
}
