import { PageTemplate } from '@/components/layout'
import { getCertifications } from '@/features/catalog/server/api'
import { catchAsyncError } from '@/features/error/utils/catchError'
import { generatePageMetadata } from '@/features/metadata/utils/generatePageMetadata'
import {
  getDashboard,
  getWeakestObjectives
} from '@/features/progress/server/api'
import { CertificationCard } from '@/features/progress/server/components/CertificationCard'
import { WeakestObjectivesPanel } from '@/features/progress/server/components/WeakestObjectivesPanel'

export const dynamic = 'force-dynamic'

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
      <PageTemplate maxWidth="wide">
        <p className="text-muted-foreground">
          Something went wrong loading the catalog. Try refreshing.
        </p>
      </PageTemplate>
    )
  }

  const [primaryCertification] = certifications

  if (!primaryCertification) {
    return (
      <PageTemplate maxWidth="wide">
        <p className="text-muted-foreground">
          No certifications seeded yet. Run{' '}
          <code className="bg-muted rounded px-1 py-0.5 font-mono">
            bun run db:seed
          </code>{' '}
          to import the question bank.
        </p>
      </PageTemplate>
    )
  }

  const dashboard = (await catchAsyncError(getDashboard())).unwrapOr([])
  const primaryCertSlug = primaryCertification.slug
  const weakestObjectives = (
    await catchAsyncError(getWeakestObjectives(primaryCertSlug))
  ).unwrapOr([])

  return (
    <PageTemplate maxWidth="wide">
      <section
        aria-label="Certifications"
        className="grid gap-4 sm:grid-cols-2"
      >
        {certifications.map((certification) => (
          <CertificationCard
            key={certification.slug}
            certification={certification}
            mastery={
              dashboard.find((entry) => entry.slug === certification.slug) ??
              null
            }
          />
        ))}
      </section>
      <WeakestObjectivesPanel
        certSlug={primaryCertSlug}
        objectives={weakestObjectives}
      />
    </PageTemplate>
  )
}
