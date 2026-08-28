'use server'

import { env } from '@/config/env'
import { handleApiError } from '@/features/error/server/lib/handleApiError'

import {
  ContactFormModel,
  type ContactFormSchema
} from '../../schemas/contactForm.schema'
import { ContactConfirmationEmail } from '../components/ContactConfirmationEmail'
import { ContactNotificationEmail } from '../components/ContactNotificationEmail'
import { sendEmail } from '../utils/sendEmail'

// react-doctor-disable-next-line react-doctor/server-auth-actions -- public contact form; Zod-validated input, no privileged mutation (see .react-doctor/false-positives.md)
export const sendContactEmail = async (data: ContactFormSchema) => {
  const parsedData = ContactFormModel.contact.parse(data)

  await Promise.all([
    handleApiError(
      sendEmail({
        user: { email: parsedData.email, name: parsedData.name },
        subject: `Thank you for contacting us, ${parsedData.name}!`,
        react: ContactConfirmationEmail(parsedData)
      })
    ),
    handleApiError(
      sendEmail({
        user: { email: env.CONTACT_TO_EMAIL, name: 'Site Owner' },
        subject: `Contact: ${parsedData.subject}`,
        react: ContactNotificationEmail(parsedData)
      })
    )
  ])
}
