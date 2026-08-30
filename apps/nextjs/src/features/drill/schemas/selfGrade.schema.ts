import { z } from 'zod'

import { idSchema } from '@/features/drill/schemas/run.schema'

export const selfGradeSchema = z.object({
  questionId: idSchema,
  hadIt: z.boolean()
})

export type SelfGradeInput = z.infer<typeof selfGradeSchema>
