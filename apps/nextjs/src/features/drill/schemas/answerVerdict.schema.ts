import { z } from 'zod'

const revealFields = {
  correctLetters: z.array(z.string()),
  answerDisplay: z.string().nullable(),
  explanation: z.string()
}

export const answerVerdictSchema = z.discriminatedUnion('verdict', [
  z.object({ verdict: z.literal('matched'), ...revealFields }),
  z.object({ verdict: z.literal('wrong'), ...revealFields }),
  z.object({ verdict: z.literal('no-match'), ...revealFields })
])

export type AnswerVerdict = z.infer<typeof answerVerdictSchema>
