import { z } from 'zod'

export const idSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/)

// `?q=` deep-links back into a run at one specific question — the summary's
// skipped list is the only thing that builds it. `.catch` keeps a stale or
// hand-edited value from 404-ing a run that is otherwise fine: it falls back
// to undefined, which the page reads as "resume where you left off".
export const drillRunSearchParamsSchema = z.object({
  q: idSchema.optional().catch(undefined)
})
