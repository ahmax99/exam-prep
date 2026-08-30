import { z } from 'zod'

import { idSchema } from '@/features/drill/schemas/run.schema'

export const submitAnswerSchema = z.object({
  questionId: idSchema,
  response: z.union([
    z.string().trim().min(1).max(500),
    z.array(z.string().trim().min(1).max(8)).min(1).max(26)
  ])
})

export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>
