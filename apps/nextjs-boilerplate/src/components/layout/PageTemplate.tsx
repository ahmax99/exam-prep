import Link from 'next/link'

import { ArrowLeft } from 'lucide-react'

import { cn } from '@/utils/mergeClass'

interface PageTemplateProps {
  alignment?: 'left' | 'center'
  back?: {
    href: string
    label: string
  }
  maxWidth?: 'regular' | 'wide'
  fullHeight?: boolean
  children: React.ReactNode
}

function PageTemplate({
  alignment = 'left',
  back,
  maxWidth = 'regular',
  fullHeight = false,
  children
}: Readonly<PageTemplateProps>) {
  if (alignment === 'center') {
    return (
      <article
        className={cn(
          'flex w-full flex-col items-center justify-center',
          fullHeight ? 'min-h-screen' : 'min-h-[calc(100vh-4rem)]'
        )}
      >
        {children}
      </article>
    )
  }

  return (
    <article
      className={cn(
        'mx-auto my-6 px-4',
        maxWidth === 'wide' ? 'max-w-3xl' : 'max-w-2xl'
      )}
    >
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
