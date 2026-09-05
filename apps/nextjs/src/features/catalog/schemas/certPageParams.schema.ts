import { z } from 'zod'

const EXAM_CODE_PATTERN = /^[A-Za-z0-9._-]{1,20}$/
const CERT_SLUG_PATTERN = /^[a-z0-9-]{1,100}$/

export const certPageParamsSchema = z.object({
  exam: z.string().trim().regex(EXAM_CODE_PATTERN).optional().catch(undefined)
})

export const certSlugSchema = z.string().trim().regex(CERT_SLUG_PATTERN)
