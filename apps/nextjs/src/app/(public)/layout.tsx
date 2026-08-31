import {
  AppRail,
  BottomTabBar,
  PageHeader,
  type AppRailPracticeItem
} from '@/components/layout'
import { logger } from '@/config/logger'
import { countBookmarks } from '@/features/bookmarks/server/api'
import { getCertifications } from '@/features/catalog/server/api'
import { ErrorScreenProvider } from '@/features/error/client/providers/ErrorScreenProvider'
import { catchAsyncError } from '@/features/error/utils/catchError'
import { getDashboard } from '@/features/progress/server/api'

export const dynamic = 'force-dynamic'

const log = logger.child({ module: 'public-layout' })

export default async function PublicLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const certifications = (await catchAsyncError(getCertifications())).match(
    (value) => value,
    (error) => {
      log.error({ error }, 'Failed to load certifications for app rail')
      return []
    }
  )
  const dashboard = (await catchAsyncError(getDashboard())).match(
    (value) => value,
    (error) => {
      log.error({ error }, 'Failed to load dashboard mastery for app rail')
      return []
    }
  )

  const primaryCertSlug = certifications[0]?.slug
  const primaryMastery = dashboard.find(
    (entry) => entry.slug === primaryCertSlug
  )
  const bookmarkCount = primaryCertSlug
    ? (await countBookmarks(primaryCertSlug)).match(
        (value) => value,
        (error) => {
          log.error({ error }, 'Failed to load bookmark count for app rail')
          return null
        }
      )
    : null
  const savedHref = primaryCertSlug ? `/${primaryCertSlug}/bookmarks` : null

  const practiceItems: AppRailPracticeItem[] = [
    {
      label: 'Missed',
      count: primaryMastery?.missed ?? null,
      href: primaryCertSlug
        ? `/${primaryCertSlug}/drill?scopeKind=MISSED&scopeValue=${primaryCertSlug}`
        : null
    },
    {
      label: 'Never seen',
      count: primaryMastery?.unseen ?? null,
      href: primaryCertSlug
        ? `/${primaryCertSlug}/drill?scopeKind=UNSEEN&scopeValue=${primaryCertSlug}`
        : null
    },
    { label: 'Bookmarked', count: bookmarkCount, href: savedHref },
    { label: 'Past runs', count: null, href: null }
  ]

  return (
    <>
      <ErrorScreenProvider />
      <PageHeader />
      <div className="flex">
        <AppRail
          certifications={certifications.map((certification) => ({
            slug: certification.slug,
            name: certification.name,
            questionCount: certification.questionCount
          }))}
          practiceItems={practiceItems}
        />
        <main className="min-w-0 flex-1 pb-20 lg:pb-0">{children}</main>
      </div>
      <BottomTabBar savedHref={savedHref} />
    </>
  )
}
