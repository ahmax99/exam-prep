import Link from 'next/link'

import { ArrowLeft } from 'lucide-react'

interface PageTemplateProps {
  back?: {
    href: string
    label: string
  }
  children: React.ReactNode
}

function PageTemplate({ back, children }: Readonly<PageTemplateProps>) {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 pt-6 pb-5 lg:max-w-[64rem] lg:px-[60px] lg:pt-[52px] lg:pb-[72px]">
      {back && (
        <nav aria-label="back" className="mb-6">
          <Link
            aria-label={back.label}
            className="text-muted-foreground hover:text-foreground -ml-1 inline-flex min-h-11 items-center gap-2 text-sm transition-colors"
            href={back.href}
          >
            <ArrowLeft className="size-4" />
            {back.label}
          </Link>
        </nav>
      )}
      {children}
    </article>
  )
}

export { PageTemplate }
