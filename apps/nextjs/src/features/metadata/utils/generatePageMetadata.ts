import type { Metadata } from 'next'

import { metadata as baseMetadata } from '../constants'

interface GeneratePageMetadataProps {
  title?: string
  description?: string
}

export const generatePageMetadata = ({
  title,
  description
}: GeneratePageMetadataProps): Metadata => {
  const pageTitle = title
    ? `${title} | ${String(baseMetadata.title)}`
    : String(baseMetadata.title)
  const pageDescription = description ?? baseMetadata.description ?? undefined

  return {
    ...baseMetadata,
    title: pageTitle,
    description: pageDescription,
    openGraph: {
      ...baseMetadata.openGraph,
      title: pageTitle,
      description: pageDescription
    },
    twitter: {
      ...baseMetadata.twitter,
      title: pageTitle,
      description: pageDescription
    }
  }
}
