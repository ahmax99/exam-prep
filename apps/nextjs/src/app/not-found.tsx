import Link from 'next/link'

import { generatePageMetadata } from '@/features/metadata/utils/generatePageMetadata'

export const metadata = generatePageMetadata({
  title: 'Not found',
  description: 'That page does not exist.'
})

export default function NotFound() {
  return (
    <main className="bg-background text-foreground flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-muted-foreground font-mono text-sm" data-numeric>
        404
      </p>
      <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance">
        That page does not exist
      </h1>
      <p className="text-muted-foreground max-w-prose text-sm">
        The link may be stale, or the certification may not be seeded yet.
      </p>
      <Link
        className="bg-brand text-brand-foreground focus-visible:ring-ring/50 mt-2 inline-flex min-h-11 items-center rounded-md px-5 text-sm font-medium transition-opacity hover:opacity-90 focus-visible:ring-[3px] focus-visible:outline-none"
        href="/"
      >
        Back to certifications
      </Link>
    </main>
  )
}
