import { z } from 'zod'

import { MAX_RUN_LIMIT } from '@/features/drill/constants'

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
  limit: z.number().int().min(1).max(MAX_RUN_LIMIT).optional()
})

export type StartRunInput = z.infer<typeof startRunSchema>
