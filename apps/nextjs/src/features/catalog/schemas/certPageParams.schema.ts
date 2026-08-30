import { z } from 'zod'

const EXAM_CODE_PATTERN = /^[A-Za-z0-9._-]{1,20}$/
const CERT_SLUG_PATTERN = /^[a-z0-9-]{1,100}$/

// `.catch` keeps a hostile or stale `?exam=` from failing the page; the
// caller falls back to the certification's default exam.
export const certPageParamsSchema = z.object({
  exam: z.string().trim().regex(EXAM_CODE_PATTERN).optional().catch(undefined)
})

export type CertPageParams = z.infer<typeof certPageParamsSchema>

// Bounds the `[cert]` path segment before it reaches four separate
// `server/api` reads; a value that doesn't match a slug shape can't match a
// row either way, so this fails the same way an unknown slug already does.
export const certSlugSchema = z.string().trim().regex(CERT_SLUG_PATTERN)
