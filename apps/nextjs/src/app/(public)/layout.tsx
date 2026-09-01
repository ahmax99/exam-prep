import { cookies } from 'next/headers'

import {
  AppSidebar,
  BottomTabBar,
  PageHeader,
  type AppSidebarPracticeItem
} from '@/components/layout'
import { SidebarProvider } from '@/components/organisms/Sidebar'
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
  const runsHref = primaryCertSlug ? `/${primaryCertSlug}/runs` : null
  const sidebarOpen = (await cookies()).get('sidebar_state')?.value !== 'false'

  // "Past runs" carries count: null on purpose — a run count would need two
  // extra Prisma queries (cert question ids + drillRun.count overlap) on
  // every page render, since DrillRun has no cert column.
  const practiceItems: AppSidebarPracticeItem[] = primaryCertSlug
    ? [
        {
          label: 'Missed',
          count: primaryMastery?.missed ?? null,
          href: `/${primaryCertSlug}/drill?scopeKind=MISSED&scopeValue=${primaryCertSlug}`
        },
        {
          label: 'Never seen',
          count: primaryMastery?.unseen ?? null,
          href: `/${primaryCertSlug}/drill?scopeKind=UNSEEN&scopeValue=${primaryCertSlug}`
        },
        // savedHref/runsHref are non-null here: both are derived from
        // primaryCertSlug, which this branch has already checked truthy.
        { label: 'Bookmarked', count: bookmarkCount, href: savedHref! },
        { label: 'Past runs', count: null, href: runsHref! }
      ]
    : []

  return (
    <SidebarProvider className="flex-col" defaultOpen={sidebarOpen}>
      <ErrorScreenProvider />
      <PageHeader />
      <div className="flex flex-1">
        <AppSidebar
          certifications={certifications.map((certification) => ({
            slug: certification.slug,
            name: certification.name,
            questionCount: certification.questionCount
          }))}
          practiceItems={practiceItems}
        />
        <main
          // Reserves exactly the tab bar's occupied height (spaces.css)
          // so the two never drift out of sync.
          className="pb-bottom-nav min-w-0 flex-1 lg:pb-0"
          id="main-content"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
      <BottomTabBar runsHref={runsHref} savedHref={savedHref} />
    </SidebarProvider>
  )
}
