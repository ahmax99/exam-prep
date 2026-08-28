import { z } from 'zod'

const emailUserSchema = z.object({
  email: z.email(),
  name: z.string()
})

export const EmailModel = {
  emailUser: emailUserSchema,
  sendEmail: z.object({
    user: emailUserSchema,
    url: z.url()
  })
}

export type EmailUser = z.infer<typeof EmailModel.emailUser>
export type SendEmail = z.infer<typeof EmailModel.sendEmail>
