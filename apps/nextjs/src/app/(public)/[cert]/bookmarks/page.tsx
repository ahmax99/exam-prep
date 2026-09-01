import { notFound } from 'next/navigation'

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
  <PageTemplate maxWidth="wide">
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
    <PageTemplate maxWidth="wide">
      <h1 className="text-2xl font-semibold">Bookmarked questions</h1>
      <p className="text-muted-foreground mt-2 font-mono text-sm">
        {total} questions saved for revision · {mastered} already mastered
      </p>

      {total === 0 ? (
        <p className="text-muted-foreground mt-8 max-w-prose">
          A bookmark marks the thing the app can't infer — a question you got
          right for the wrong reason. Press <kbd className="font-mono">B</kbd>{' '}
          or tap the bookmark glyph during a drill to save one here.
        </p>
      ) : (
        <>
          <div className="mt-4">
            <DrillBookmarksButton certSlug={cert} count={total} />
          </div>
          <ul className="mt-6">
            {items.map((item) => (
              <BookmarkRow key={item.questionId} item={item} />
            ))}
          </ul>
        </>
      )}
    </PageTemplate>
  )
}
