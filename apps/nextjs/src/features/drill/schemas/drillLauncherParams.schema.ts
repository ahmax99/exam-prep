import { z } from 'zod'

import { startRunSchema } from '@/features/drill/schemas/startRun.schema'

// `scopeValue` is optional because CERT/MISSED/UNSEEN/BOOKMARKS don't carry
// one; the scopes that require it are enforced by `buildScopeWhere`.
export const drillLauncherParamsSchema = z.object({
  scopeKind: startRunSchema.shape.scopeKind,
  scopeValue: startRunSchema.shape.scopeValue.optional().default('')
})

export type DrillLauncherParams = z.infer<typeof drillLauncherParamsSchema>
