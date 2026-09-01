import { z } from 'zod'

import { MAX_RUN_LIMIT } from '@/features/drill/constants'
import { startRunSchema } from '@/features/drill/schemas/startRun.schema'

// `scopeValue` is optional because CERT/MISSED/UNSEEN/BOOKMARKS don't carry
// one; the scopes that require it are enforced by `buildScopeWhere`.
export const drillLauncherParamsSchema = z.object({
  scopeKind: startRunSchema.shape.scopeKind,
  scopeValue: startRunSchema.shape.scopeValue.optional().default(''),
  // `.catch` (as in certPageParamsSchema) keeps a stale or hand-edited
  // `?limit=` from 404-ing the launcher — it falls back to DEFAULT_RUN_LIMIT.
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_RUN_LIMIT)
    .optional()
    .catch(undefined)
})

export type DrillLauncherParams = z.infer<typeof drillLauncherParamsSchema>
