import { z } from 'zod'

import { idSchema } from '@/features/drill/schemas/run.schema'

export const runCreatedSchema = z.object({ id: idSchema })
export type RunCreated = z.infer<typeof runCreatedSchema>
