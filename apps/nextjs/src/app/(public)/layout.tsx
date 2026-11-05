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
import { drillHref } from '@/features/drill/lib/drillHref'
import { catchAsyncError } from '@/features/error/utils/catchError'
import { getDashboard, type ExamMastery } from '@/features/progress/server/api'

export const dynamic = 'force-dynamic'

const log = logger.child({ module: 'public-layout' })

export default async function PublicLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const [certificationsResult, dashboardResult, cookieStore] =
    await Promise.all([
      catchAsyncError(getCertifications()),
      catchAsyncError(getDashboard()),
      cookies()
    ])

  const certifications = certificationsResult.match(
    (value) => value,
    (error) => {
      log.error({ error }, 'Failed to load certifications for app rail')
      return []
    }
  )
  const dashboard = dashboardResult.match(
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
  const sidebarOpen = cookieStore.get('sidebar_state')?.value !== 'false'

  // One row per exam, so a Missed or Never seen drill never mixes exams.
  const examItems = (
    label: string,
    scopeKind: 'MISSED' | 'UNSEEN',
    countOf: (exam: ExamMastery) => number
  ): AppSidebarPracticeItem[] => {
    const exams = primaryMastery?.exams ?? []
    return primaryCertSlug
      ? exams.map((exam) => ({
          label: exams.length > 1 ? `${label} · ${exam.code}` : label,
          count: countOf(exam),
          href: drillHref(primaryCertSlug, {
            scopeKind,
            scopeValue: exam.code
          }),
          tone: scopeKind === 'MISSED' ? 'destructive' : undefined
        }))
      : []
  }

  const practiceItems: AppSidebarPracticeItem[] = primaryCertSlug
    ? [
        ...examItems('Missed', 'MISSED', (exam) => exam.missed),
        ...examItems('Never seen', 'UNSEEN', (exam) => exam.unseen),
        { label: 'Bookmarked', count: bookmarkCount, href: savedHref! },
        { label: 'Past runs', count: null, href: runsHref! }
      ]
    : []

  return (
    <SidebarProvider className="flex-col" defaultOpen={sidebarOpen}>
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
