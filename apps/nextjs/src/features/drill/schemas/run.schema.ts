import { z } from 'zod'

export const idSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/)

export const drillRunSearchParamsSchema = z.object({
  q: idSchema.optional().catch(undefined)
})
