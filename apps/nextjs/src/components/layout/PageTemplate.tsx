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
    <article className="mx-auto my-8 w-full max-w-3xl px-4 lg:my-12 lg:max-w-[64rem] lg:px-8">
      {back && (
        <nav aria-label="back" className="mb-10">
          <Link
            aria-label={back.label}
            className="inline-flex items-center"
            href={back.href}
          >
            <ArrowLeft className="mr-2 size-4" />
            {back.label}
          </Link>
        </nav>
      )}
      {children}
    </article>
  )
}

export { PageTemplate }
