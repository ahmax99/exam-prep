import { z } from 'zod'

const emailUserSchema = z.object({
  email: z.email(),
  name: z.string()
})

const EmailModel = {
  user: emailUserSchema
}

export type EmailUser = z.infer<typeof EmailModel.user>
