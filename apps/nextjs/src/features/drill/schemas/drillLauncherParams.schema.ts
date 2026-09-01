import { z } from 'zod'

import { startRunSchema } from '@/features/drill/schemas/startRun.schema'

// `scopeValue` is optional because CERT/MISSED/UNSEEN/BOOKMARKS don't carry
// one; the scopes that require it are enforced by `buildScopeWhere`.
export const drillLauncherParamsSchema = z.object({
  scopeKind: startRunSchema.shape.scopeKind,
  scopeValue: startRunSchema.shape.scopeValue.optional().default(''),
  // `.catch` (as in certPageParamsSchema) keeps a stale or hand-edited
  // `?limit=` from 404-ing the launcher — it falls back to undefined, which
  // `startRun` reads as "every question in scope", not a smaller default.
  limit: z.coerce.number().int().min(1).optional().catch(undefined)
})

export type DrillLauncherParams = z.infer<typeof drillLauncherParamsSchema>
