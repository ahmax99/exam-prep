import { Resend } from 'resend'

import { env } from '@/config/env'
import { catchAsyncError } from '@/features/error/utils/catchError'

import type { EmailUser } from '../../schemas/email.schema'

const resend = new Resend(env.RESEND_API_KEY)

interface SendEmailParams {
  user: EmailUser
  subject: string
  react: React.ReactElement
}

export const sendEmail = ({ user, subject, react }: SendEmailParams) =>
  catchAsyncError(
    resend.emails.send({
      from: `nextjs-boilerplate <${env.FROM_EMAIL}>`,
      to: [user.email],
      subject,
      react
    })
  )
