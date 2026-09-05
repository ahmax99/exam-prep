import { z } from 'zod'

import { startRunSchema } from '@/features/drill/schemas/startRun.schema'

export const drillLauncherParamsSchema = z.object({
  scopeKind: startRunSchema.shape.scopeKind,
  scopeValue: startRunSchema.shape.scopeValue.optional().default(''),

  limit: z.coerce.number().int().min(1).optional().catch(undefined),

  fresh: z
    .literal('1')
    .optional()
    .catch(undefined)
    .transform((value) => value === '1')
})

export type DrillLauncherParams = z.infer<typeof drillLauncherParamsSchema>
