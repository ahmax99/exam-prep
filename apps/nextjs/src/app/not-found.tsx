import Link from 'next/link'

import { Button } from '@/components/atoms'
import { generatePageMetadata } from '@/features/metadata/utils/generatePageMetadata'

export const metadata = generatePageMetadata({
  title: 'Not found',
  description: 'That page does not exist.'
})

export default function NotFound() {
  return (
    <main className="bg-background text-foreground flex min-h-[70dvh] flex-col items-center justify-center px-8 text-center">
      <p
        className="text-muted-foreground font-mono text-[13px] tracking-[-0.04em]"
        data-numeric
      >
        404
      </p>
      <h1 className="mt-3.5 max-w-[24ch] text-[30px] leading-[1.15] font-semibold tracking-[-0.025em] text-balance">
        That page does not exist
      </h1>
      <p className="text-prose-foreground mt-3.5 max-w-[46ch] text-[15px] leading-[1.6]">
        The link may be stale, or the certification may not be seeded yet.
      </p>
      <Button
        className="mt-[26px]"
        nativeButton={false}
        render={<Link href="/" />}
        variant="brand"
      >
        Back to certifications
      </Button>
    </main>
  )
}
