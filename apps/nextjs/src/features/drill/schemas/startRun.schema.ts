import { z } from 'zod'

export const startRunSchema = z.object({
  scopeKind: z.enum([
    'CERT',
    'EXAM',
    'TOPIC',
    'OBJECTIVE',
    'MISSED',
    'UNSEEN',
    'BOOKMARKS'
  ]),
  scopeValue: z.string().trim().max(200),
  certSlug: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  // No upper bound: a run defaults to every question in scope, so `limit`
  // exists only to request a smaller subset, never to cap a larger one.
  limit: z.number().int().min(1).optional()
})

export type StartRunInput = z.infer<typeof startRunSchema>
