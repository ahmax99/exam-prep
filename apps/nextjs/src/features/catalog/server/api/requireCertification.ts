import 'server-only'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import { certSlugSchema } from '@/features/catalog/schemas/certPageParams.schema'
import { orNotFound } from '@/features/error/utils/orNotFound'

import { getCertification } from './getCertification'

// For [cert] pages: a bad or unknown slug renders the 404 page.
export const requireCertification = cache(async (cert: string) => {
  const parsed = certSlugSchema.safeParse(cert)
  if (!parsed.success) notFound()
  return orNotFound(getCertification(parsed.data))
})
