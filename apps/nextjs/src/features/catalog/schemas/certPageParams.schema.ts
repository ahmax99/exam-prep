import { z } from 'zod'

const EXAM_CODE_PATTERN = /^[A-Za-z0-9._-]{1,20}$/

// `.catch` keeps a hostile or stale `?exam=` from failing the page; the
// caller falls back to the certification's default exam.
export const certPageParamsSchema = z.object({
  exam: z.string().trim().regex(EXAM_CODE_PATTERN).optional().catch(undefined)
})

export type CertPageParams = z.infer<typeof certPageParamsSchema>
