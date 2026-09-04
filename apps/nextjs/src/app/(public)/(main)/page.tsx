import { PageTemplate } from '@/components/layout'
import { logger } from '@/config/logger'
import { getCertifications } from '@/features/catalog/server/api'
import { recommendDrill } from '@/features/drill/lib/recommendation'
import { RecommendedDrill } from '@/features/drill/server/components/RecommendedDrill'
import { catchAsyncError } from '@/features/error/utils/catchError'
import { generatePageMetadata } from '@/features/metadata/utils/generatePageMetadata'
import {
  getDashboard,
  getWeakestObjectives
} from '@/features/progress/server/api'
import { CertificationCard } from '@/features/progress/server/components/CertificationCard'
import { WeakestObjectivesPanel } from '@/features/progress/server/components/WeakestObjectivesPanel'
import { cn } from '@/utils/mergeClass'

export const dynamic = 'force-dynamic'

const log = logger.child({ module: 'dashboard-page' })

export const generateMetadata = () =>
  generatePageMetadata({
    title: 'Dashboard',
    description: 'See which certifications and objectives need the most work.'
  })

export default async function HomePage() {
  const certifications = (await catchAsyncError(getCertifications())).unwrapOr(
    null
  )

  if (certifications === null) {
    return (
      <PageTemplate>
        <h1 className="text-4xl leading-tight font-semibold tracking-tight text-balance">
          Practice recall until the exam is boring
        </h1>
        <p className="text-muted-foreground mt-2">
          Something went wrong loading the catalog. Try refreshing.
        </p>
      </PageTemplate>
    )
  }

  const [primaryCertification] = certifications

  if (!primaryCertification) {
    return (
      <PageTemplate>
        <h1 className="text-4xl leading-tight font-semibold tracking-tight text-balance">
          Practice recall until the exam is boring
        </h1>
        <p className="text-muted-foreground mt-2">
          No certifications seeded yet. Run{' '}
          <code className="bg-muted rounded px-1 py-0.5 font-mono">
            bun run db:seed
          </code>{' '}
          to import the question bank.
        </p>
      </PageTemplate>
    )
  }

  const dashboard = (await catchAsyncError(getDashboard())).match(
    (value) => value,
    (error) => {
      log.error({ error }, 'Failed to load dashboard mastery')
      return []
    }
  )
  const primaryCertSlug = primaryCertification.slug
  const primaryMastery =
    dashboard.find((entry) => entry.slug === primaryCertSlug) ?? null
  const weakestObjectives = (
    await catchAsyncError(getWeakestObjectives(primaryCertSlug))
  ).match(
    (value) => value,
    (error) => {
      log.error(
        { error, certSlug: primaryCertSlug },
        'Failed to load weakest objectives'
      )
      return []
    }
  )
  const hasAttempts = (primaryMastery?.attempted ?? 0) > 0
  const recommendation = recommendDrill({
    certSlug: primaryCertSlug,
    missed: primaryMastery?.missed ?? 0,
    unseen: primaryMastery?.unseen ?? 0,
    questionCount: primaryCertification.questionCount
  })

  return (
    <PageTemplate>
      <h1 className="text-4xl leading-tight font-semibold tracking-tight text-balance md:text-5xl">
        Practice recall until the exam is boring
      </h1>
      <p className="text-muted-foreground mt-3 max-w-prose">
        Answer from memory, grade yourself honestly, and drill the objectives
        you keep missing.
      </p>
      <div className="mt-8">
        <RecommendedDrill
          certSlug={primaryCertSlug}
          recommendation={recommendation}
        />
      </div>
      <section
        aria-label="Certifications"
        className={cn(
          'mt-6 grid gap-4',
          certifications.length > 1 && 'sm:grid-cols-2'
        )}
      >
        {certifications.map((certification) => (
          <CertificationCard
            key={certification.slug}
            certification={certification}
            mastery={
              certification.slug === primaryCertSlug
                ? primaryMastery
                : (dashboard.find(
                    (entry) => entry.slug === certification.slug
                  ) ?? null)
            }
          />
        ))}
      </section>
      <WeakestObjectivesPanel
        certSlug={primaryCertSlug}
        hasAttempts={hasAttempts}
        objectives={weakestObjectives}
      />
    </PageTemplate>
  )
}
