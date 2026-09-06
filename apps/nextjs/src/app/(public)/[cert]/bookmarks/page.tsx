import { notFound } from 'next/navigation'

import { Empty } from '@/components/atoms'
import { PageTemplate } from '@/components/layout'
import { logger } from '@/config/logger'
import { BookmarkRow } from '@/features/bookmarks/client/components/BookmarkRow'
import { DrillBookmarksButton } from '@/features/bookmarks/client/components/DrillBookmarksButton'
import { listBookmarks } from '@/features/bookmarks/server/api'
import { certSlugSchema } from '@/features/catalog/schemas/certPageParams.schema'
import { getCertification } from '@/features/catalog/server/api'
import { catchAsyncError } from '@/features/error/utils/catchError'
import { generatePageMetadata } from '@/features/metadata/utils/generatePageMetadata'

export const dynamic = 'force-dynamic'

const log = logger.child({ module: 'bookmarks-page' })

export const generateMetadata = () =>
  generatePageMetadata({
    title: 'Bookmarks',
    description: 'Questions saved for revision.'
  })

interface BookmarksPageProps {
  params: Promise<{ cert: string }>
}

const failureFallback = (
  <PageTemplate>
    <p className="text-muted-foreground">
      Something went wrong loading this page. Try refreshing.
    </p>
  </PageTemplate>
)

export default async function BookmarksPage({
  params
}: Readonly<BookmarksPageProps>) {
  const parsedCert = certSlugSchema.safeParse((await params).cert)
  if (!parsedCert.success) notFound()
  const cert = parsedCert.data

  const certResult = await catchAsyncError(getCertification(cert))
  if (certResult.isErr()) {
    if (certResult.error.code === 'NOT_FOUND') notFound()
    log.error(
      { error: certResult.error, certSlug: cert },
      'Failed to load certification for bookmarks page'
    )
    return failureFallback
  }

  const bookmarksResult = await listBookmarks(cert)
  if (bookmarksResult.isErr()) {
    log.error(
      { error: bookmarksResult.error, certSlug: cert },
      'Failed to load bookmarks'
    )
    return failureFallback
  }

  const items = bookmarksResult.value
  const total = items.length
  const mastered = items.filter((item) => item.state === 'MASTERED').length

  return (
    <PageTemplate>
      <h1 className="text-[30px] font-semibold tracking-[-0.025em]">
        Bookmarked questions
      </h1>
      <p className="text-muted-foreground mt-2.5 text-sm">
        {total} {total === 1 ? 'question' : 'questions'} saved for revision ·{' '}
        {mastered} already mastered
      </p>

      {total === 0 ? (
        <Empty
          className="mt-7"
          description="A bookmark marks the thing the app can't infer — a question you got right for the wrong reason."
          label="Bookmarks"
          title="Nothing saved yet"
        >
          <p className="text-prose-foreground mt-2 max-w-[56ch] text-[15px] leading-[1.6]">
            Press{' '}
            <kbd className="border-border bg-muted rounded-[3px] border px-1.5 py-0.5 font-mono text-xs">
              B
            </kbd>{' '}
            or tap the bookmark glyph during a drill to save one here.
          </p>
        </Empty>
      ) : (
        <>
          <div className="mt-[22px]">
            <DrillBookmarksButton certSlug={cert} count={total} />
          </div>
          <ul className="border-border bg-card mt-[30px] overflow-hidden rounded-lg border">
            {items.map((item) => (
              <BookmarkRow key={item.questionId} item={item} />
            ))}
          </ul>
        </>
      )}
    </PageTemplate>
  )
}
